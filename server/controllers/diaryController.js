import pool from "../config/db.config.js";
import jwt from "jsonwebtoken";

/* helper: get numeric user_id from request
   - Tries Authorization Bearer token (id claim may be UUID or numeric)
   - Falls back to req.query.user_id / req.query.user_uuid / req.body.*
*/

// Fix: Always resolve to numeric user_id, even if JWT contains a UUID
async function resolveUserIdFromReq(req) {
	const authHeader = req.headers?.authorization;
	if (authHeader && authHeader.startsWith("Bearer ")) {
		const token = authHeader.split(" ")[1];
		try {
			const payload = jwt.verify(token, process.env.JWT_SECRET);
			// If payload.id is a UUID, look up numeric user_id
			let id = payload?.id ?? payload?.user_id ?? null;
			if (id) {
				// If id is numeric, use directly
				if (/^\d+$/.test(id)) return parseInt(id, 10);
				// Otherwise, treat as UUID and look up user_id
				const { rows } = await pool.query(
					"SELECT user_id FROM users WHERE user_id = $1 LIMIT 1",
					[id]
				);
				if (rows[0]?.user_id) return rows[0].user_id;
			}
		} catch (e) {
			console.warn("Could not verify JWT:", e.message);
			return null;
		}
	}
	// Fallback for non-JWT requests if necessary
	// Accept user_id or user_uuid in body/query, but always resolve to numeric user_id
	const payload = { ...req.query, ...req.body };
	let raw = payload.user_id ?? payload.user_uuid ?? null;
	if (!raw) return null;
	if (/^\d+$/.test(raw)) return parseInt(raw, 10);
	// If raw is UUID, look up user_id
	const { rows } = await pool.query(
		"SELECT user_id FROM users WHERE user_id = $1 LIMIT 1",
		[raw]
	);
	return rows[0]?.user_id ?? null;
}

/* helper: format input to SQL timestamp (YYYY-MM-DD HH:MM:SS) */
function toSQLDateTime(input) {
	if (!input) return null;
	const d = new Date(input);
	if (!isNaN(d.getTime())) {
		return d.toISOString().replace("T", " ").slice(0, 19);
	}
	// accept "YYYY-MM-DDTHH:MM" formats
	if (typeof input === "string" && input.includes("T")) {
		return input.replace("T", " ") + (input.length === 16 ? ":00" : "");
	}
	return input;
}

/* POST /api/diary
   body: { title_encrypted, content_encrypted, mood, tags_encrypted, visibility, entry_date, emotion_score }
*/
export const createEntry = async (req, res) => {
	try {
		const user_id = await resolveUserIdFromReq(req);
		if (!user_id)
			return res
				.status(401)
				.json({ message: "Unauthorized or user not found" });

		const {
			title_encrypted = null,
			content_encrypted,
			mood = "neutral",
			tags_encrypted = null,
			visibility = "Private",
			entry_date = null,
			emotion_score = null,
		} = req.body;

		if (!content_encrypted)
			return res.status(400).json({ message: "content_encrypted required" });

		const entryDateTime =
			toSQLDateTime(entry_date) ??
			new Date().toISOString().replace("T", " ").slice(0, 19);

		const insertSql = `INSERT INTO DiaryEntries (user_id, title_encrypted, content_encrypted, mood, tags_encrypted, visibility, entry_date, emotion_score)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING entry_id`;
		const values = [
			user_id,
			title_encrypted,
			content_encrypted,
			mood,
			tags_encrypted,
			visibility,
			entryDateTime,
			emotion_score,
		];
		const { rows } = await pool.query(insertSql, values);

		return res
			.status(201)
			.json({ entry_id: rows[0]?.entry_id ?? null, message: "Entry created" });
	} catch (err) {
		console.error("❌ createEntry:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

/* GET /api/diary
   optionally supports query params: entry_date, visibility, limit, offset
   returns entries for logged-in user
*/
export const getEntries = async (req, res) => {
	try {
		const user_id = await resolveUserIdFromReq(req);
		console.log("data", user_id);
		if (!user_id)
			return res
				.status(401)
				.json({ message: "Unauthorized or user not found" });

		console.log("data", req.body);

		let sql = "SELECT * FROM DiaryEntries WHERE user_id = $1";
		const vals = [user_id];
		let idx = 2;

		if (req.query.visibility) {
			sql += ` AND visibility = $${idx++}`;
			vals.push(req.query.visibility);
		}
		if (req.query.entry_date) {
			// match date part
			sql += ` AND DATE(entry_date) = $${idx++}`;
			vals.push(req.query.entry_date);
		}

		sql += " ORDER BY entry_date DESC, created_at DESC";

		// paging
		const limit = parseInt(req.query.limit, 10) || 100;
		const offset = parseInt(req.query.offset, 10) || 0;
		sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
		vals.push(limit, offset);

		const { rows } = await pool.query(sql, vals);
		return res.json({ entries: rows });
	} catch (err) {
		console.error("❌ getEntries:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

/* GET /api/diary/:entry_id */
// Fix getEntryById to accept both UUID and integer entry_id
export const getEntryById = async (req, res) => {
	try {
		const user_id = await resolveUserIdFromReq(req);
		if (!user_id)
			return res
				.status(401)
				.json({ message: "Unauthorized or user not found" });

		const entryId = req.params.entry_id;
		// Check if entryId is integer or UUID
		let sql, params;
		if (/^\d+$/.test(entryId)) {
			// Numeric entry_id
			sql = "SELECT * FROM DiaryEntries WHERE entry_id = $1 AND user_id = $2 LIMIT 1";
			params = [parseInt(entryId, 10), user_id];
		} else {
			// UUID entry_id
			sql = "SELECT * FROM DiaryEntries WHERE entry_uuid = $1 AND user_id = $2 LIMIT 1";
			params = [entryId, user_id];
		}
		const { rows } = await pool.query(sql, params);
		const entry = rows[0];
		if (!entry) return res.status(404).json({ message: "Entry not found" });
		return res.json({ entry });
	} catch (err) {
		console.error("❌ getEntryById:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

/* PUT /api/diary/:entry_id
   accepts same fields as create; partial update allowed
*/
export const updateEntry = async (req, res) => {
	try {
		const user_id = await resolveUserIdFromReq(req);
		if (!user_id)
			return res
				.status(401)
				.json({ message: "Unauthorized or user not found" });

		const entryId = req.params.entry_id;

		// ensure entry belongs to user
		const { rows: checkRows } = await pool.query(
			"SELECT * FROM DiaryEntries WHERE entry_id = $1 AND user_id = $2 LIMIT 1",
			[entryId, user_id]
		);
		if (!checkRows[0])
			return res.status(404).json({ message: "Entry not found" });

		const allowed = [
			"title_encrypted",
			"content_encrypted",
			"mood",
			"tags_encrypted",
			"visibility",
			"entry_date",
			"emotion_score",
		];
		const updates = [];
		const vals = [];
		let idx = 1;

		for (const key of allowed) {
			if (req.body[key] !== undefined) {
				if (key === "entry_date") {
					updates.push(`${key} = $${idx++}`);
					vals.push(toSQLDateTime(req.body[key]));
				} else {
					updates.push(`${key} = $${idx++}`);
					vals.push(req.body[key]);
				}
			}
		}
		if (updates.length === 0)
			return res.status(400).json({ message: "No fields to update" });

		// push entryId as last param
		vals.push(entryId);
		const sql = `UPDATE DiaryEntries SET ${updates.join(
			", "
		)} WHERE entry_id = $${idx}`;
		const result = await pool.query(sql, vals);
		return res.json({
			message: "Entry updated",
			affectedRows: result.rowCount,
		});
	} catch (err) {
		console.error("❌ updateEntry:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

/* DELETE /api/diary/:entry_id */
export const deleteEntry = async (req, res) => {
	try {
		const user_id = await resolveUserIdFromReq(req);
		if (!user_id)
			return res
				.status(401)
				.json({ message: "Unauthorized or user not found" });

		const entryId = req.params.entry_id;
		// ensure belongs to user
		const { rows: checkRows } = await pool.query(
			"SELECT * FROM DiaryEntries WHERE entry_id = $1 AND user_id = $2 LIMIT 1",
			[entryId, user_id]
		);
		if (!checkRows[0])
			return res.status(404).json({ message: "Entry not found" });

		await pool.query(
			"DELETE FROM DiaryEntries WHERE entry_id = $1 AND user_id = $2",
			[entryId, user_id]
		);
		return res.json({ message: "Entry deleted" });
	} catch (err) {
		console.error("❌ deleteEntry:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

/* GET /api/diary/moods/stats
   Returns counts grouped by mood for the logged-in user (optional ?since=YYYY-MM-DD and ?until=YYYY-MM-DD)
*/
export const getMoodStats = async (req, res) => {
	try {
		const user_id = await resolveUserIdFromReq(req);
		if (!user_id)
			return res
				.status(401)
				.json({ message: "Unauthorized or user not found" });

		let sql =
			"SELECT mood, COUNT(*) AS count FROM DiaryEntries WHERE user_id = $1";
		const vals = [user_id];
		let idx = 2;

		if (req.query.since) {
			sql += ` AND entry_date >= $${idx++}`;
			vals.push(toSQLDateTime(req.query.since));
		}
		if (req.query.until) {
			sql += ` AND entry_date <= $${idx++}`;
			vals.push(toSQLDateTime(req.query.until));
		}

		sql += " GROUP BY mood";
		const { rows } = await pool.query(sql, vals);
		return res.json({ stats: rows });
	} catch (err) {
		console.error("❌ getMoodStats:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

/* GET /api/diary/date/:date  (date in YYYY-MM-DD) */
export const getEntriesByDate = async (req, res) => {
	try {
		const user_id = await resolveUserIdFromReq(req);
		if (!user_id)
			return res
				.status(401)
				.json({ message: "Unauthorized or user not found" });

		const date = req.params.date;
		const { rows } = await pool.query(
			"SELECT * FROM DiaryEntries WHERE user_id = $1 AND DATE(entry_date) = $2 ORDER BY entry_date DESC",
			[user_id, date]
		);
		return res.json({ entries: rows });
	} catch (err) {
		console.error("❌ getEntriesByDate:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

/* GET /api/diary/tags/:tag
   NOTE: tags_encrypted is encrypted blob; server cannot search plaintext tags.
   This endpoint expects the client to provide the exact encrypted tag string if available,
   or returns an explanation if tags are encrypted and client didn't provide encrypted value.
*/
export const getEntriesByTag = async (req, res) => {
	try {
		const user_id = await resolveUserIdFromReq(req);
		if (!user_id)
			return res
				.status(401)
				.json({ message: "Unauthorized or user not found" });

		const tag = req.params.tag;
		const isLikelyEncrypted = typeof tag === "string" && tag.length > 50; // heuristic
		if (!isLikelyEncrypted) {
			return res.status(400).json({
				message:
					"Server cannot search plaintext tags. Provide encrypted tag value or perform client-side filtering after fetching entries.",
			});
		}

		const { rows } = await pool.query(
			"SELECT * FROM DiaryEntries WHERE user_id = $1 AND tags_encrypted = $2 ORDER BY entry_date DESC",
			[user_id, tag]
		);
		return res.json({ entries: rows });
	} catch (err) {
		console.error("❌ getEntriesByTag:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

/* GET /api/diary/search?q=...
   NOTE: encrypted fields cannot be searched server-side.
   This returns entries for the user and leaves content/title filtering to the client after decryption.
*/
export const searchEntries = async (req, res) => {
	try {
		const user_id = await resolveUserIdFromReq(req);
		if (!user_id)
			return res
				.status(401)
				.json({ message: "Unauthorized or user not found" });

		const q = req.query.q ?? "";
		let sql = "SELECT * FROM DiaryEntries WHERE user_id = $1";
		const vals = [user_id];
		let idx = 2;

		if (req.query.mood) {
			sql += ` AND mood = $${idx++}`;
			vals.push(req.query.mood);
		}
		sql += " ORDER BY entry_date DESC LIMIT 500";
		const { rows } = await pool.query(sql, vals);
		return res.json({
			message:
				"Server cannot search encrypted content. Returned candidate entries. Client must decrypt and filter locally.",
			entries: rows,
		});
	} catch (err) {
		console.error("❌ searchEntries:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

/* GET /api/diary/missing
   Returns array of dates (YYYY-MM-DD) for which the user has no diary entry in the past 3 days (excluding today)
*/
export const getMissingDiaryDates = async (req, res) => {
	try {
		const user_id = await resolveUserIdFromReq(req);
		if (!user_id)
			return res
				.status(401)
				.json({ message: "Unauthorized or user not found" });

		// Get past 3 days (excluding today)
		const dates = [];
		for (let i = 1; i <= 3; i++) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			dates.push(d.toISOString().slice(0, 10)); // "YYYY-MM-DD"
		}

		// Query for existing entries for those dates
		const placeholders = dates.map((_, i) => `$${i + 2}`).join(", ");
		const sql = `SELECT DATE(entry_date) as entry_date FROM DiaryEntries WHERE user_id = $1 AND DATE(entry_date) IN (${placeholders})`;
		const { rows } = await pool.query(sql, [user_id, ...dates]);
		const writtenDates = new Set(rows.map((r) => r.entry_date));

		// Filter out dates that already have an entry
		const missingDates = dates.filter((d) => !writtenDates.has(d));

		return res.json({ missing: missingDates });
	} catch (err) {
		console.error("❌ getMissingDiaryDates:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};
