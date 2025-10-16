import db from "../config/db.config.js";

/*
  Task/Category/Subtask controller
  - Exports: category and task/subtask CRUD handlers
  - Attempts to write to ActivityLog for each change (if table exists)
*/

async function resolveUserIdFromPayload(payload) {
	// payload may have user_id (int/string) or user_uuid (uuid)
	if (!payload) return null;
	const raw = payload.user_id ?? payload.user_uuid ?? null;
	if (!raw) return null;

	const asInt = parseInt(raw, 10);
	if (!isNaN(asInt) && String(asInt) === String(raw)) return asInt;

	// lookup numeric id by uuid
	const [rows] = await db.promise().query("SELECT user_id FROM users WHERE user_uuid = ? LIMIT 1", [raw]);
	return rows[0]?.user_id ?? null;
}

async function logActivity(user_id, action, entity, entity_id = null, details = null) {
	try {
		// Try to insert into ActivityLog table if it exists
		await db.promise().query(
			"INSERT INTO ActivityLog (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)",
			[user_id, action, entity, entity_id, details ? JSON.stringify(details) : null]
		);
	} catch (err) {
		// If table doesn't exist or other error, warn and continue
		console.warn("ActivityLog insert skipped or failed:", err.code || err.message);
	}
}

// helper: normalize incoming date (string or Date) to MySQL DATETIME "YYYY-MM-DD HH:MM:SS"
function toMySQLDateTime(input) {
	// if not provided, return null (DB can use NULL)
	if (!input) return null;
	const d = new Date(input);
	if (isNaN(d.getTime())) {
		// try simple replacement if input is "YYYY-MM-DDTHH:MM" (from datetime-local)
		if (typeof input === "string" && input.includes("T")) {
			// ensure seconds
			const withSpace = input.replace("T", " ");
			return withSpace.length === 16 ? withSpace + ":00" : withSpace;
		}
		// fallback: return input as-is and let DB handle or error
		return input;
	}
	const iso = d.toISOString().replace("T", " ").slice(0, 19);
	return iso;
}

/* ---------------------------
   Categories
   --------------------------- */

export const createCategory = async (req, res) => {
	try {
		const { name, color = "#6B7280", icon = null } = req.body;
		const user_id = await resolveUserIdFromPayload(req.body);
		if (!user_id || !name) return res.status(400).json({ message: "user_id and name required" });

		const [result] = await db.promise().query(
			"INSERT INTO Categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)",
			[user_id, name, color, icon]
		);

		await logActivity(user_id, "create_category", "category", result.insertId, { name, color, icon });

		return res.status(201).json({ category_id: result.insertId, message: "Category created" });
	} catch (err) {
		console.error("❌ createCategory:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const getCategories = async (req, res) => {
	try {
		const user_id = await resolveUserIdFromPayload(req.query || req.body);
		if (!user_id) return res.status(400).json({ message: "user_id required" });

		const [rows] = await db.promise().query("SELECT * FROM Categories WHERE user_id = ? ORDER BY name", [user_id]);
		return res.json({ categories: rows });
	} catch (err) {
		console.error("❌ getCategories:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const updateCategory = async (req, res) => {
	try {
		const id = req.params.id;
		const { name, color, icon } = req.body;
		const updates = [];
		const vals = [];

		if (name !== undefined) { updates.push("name = ?"); vals.push(name); }
		if (color !== undefined) { updates.push("color = ?"); vals.push(color); }
		if (icon !== undefined) { updates.push("icon = ?"); vals.push(icon); }

		if (updates.length === 0) return res.status(400).json({ message: "No fields to update" });

		vals.push(id);
		const sql = `UPDATE Categories SET ${updates.join(", ")} WHERE category_id = ?`;
		const [result] = await db.promise().query(sql, vals);

		// activity log (try resolve user from category)
		try {
			const [r] = await db.promise().query("SELECT user_id FROM Categories WHERE category_id = ? LIMIT 1", [id]);
			const user_id = r[0]?.user_id ?? null;
			if (user_id) await logActivity(user_id, "update_category", "category", id, { name, color, icon });
		} catch (e) {
			// ignore
		}

		return res.json({ message: "Category updated", affectedRows: result.affectedRows });
	} catch (err) {
		console.error("❌ updateCategory:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const deleteCategory = async (req, res) => {
	try {
		const id = req.params.id;
		// fetch user_id for activity
		const [rows] = await db.promise().query("SELECT user_id, name FROM Categories WHERE category_id = ? LIMIT 1", [id]);
		const cat = rows[0];
		if (!cat) return res.status(404).json({ message: "Category not found" });

		const [result] = await db.promise().query("DELETE FROM Categories WHERE category_id = ?", [id]);

		await logActivity(cat.user_id, "delete_category", "category", id, { name: cat.name });

		return res.json({ message: "Category deleted" });
	} catch (err) {
		console.error("❌ deleteCategory:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

/* ---------------------------
   Tasks
   --------------------------- */

export const createTask = async (req, res) => {
	try {
		const {
			category_id = null,
			title_encrypted,
			description_encrypted = null,
			priority = "Medium",
			due_date = null,
			status = "Pending",
		} = req.body;

		const user_id = await resolveUserIdFromPayload(req.body);
		if (!user_id || !title_encrypted) return res.status(400).json({ message: "user_id and title_encrypted required" });

		const due = toMySQLDateTime(due_date);
		const [result] = await db.promise().query(
			`INSERT INTO Tasks (user_id, category_id, title_encrypted, description_encrypted, priority, due_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[user_id, category_id, title_encrypted, description_encrypted, priority, due, status]
		);

		await logActivity(user_id, "create_task", "task", result.insertId, { category_id, priority, due_date });

		return res.status(201).json({ task_id: result.insertId, message: "Task created" });
	} catch (err) {
		console.error("❌ createTask:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const getTasks = async (req, res) => {
	try {
		const payload = (req.query && Object.keys(req.query).length) ? req.query : req.body;
		const user_id = await resolveUserIdFromPayload(payload);
		if (!user_id) return res.status(400).json({ message: "user_id required" });

		let sql = "SELECT * FROM Tasks WHERE user_id = ?";
		const vals = [user_id];

		if (req.query.status) { sql += " AND status = ?"; vals.push(req.query.status); }
		if (req.query.category) { sql += " AND category_id = ?"; vals.push(req.query.category); }
		if (req.query.priority) { sql += " AND priority = ?"; vals.push(req.query.priority); }
		if (req.query.search) { sql += " AND title_encrypted LIKE ?"; vals.push(`%${req.query.search}%`); }

		if (req.query.sort === "due_date") sql += " ORDER BY due_date ASC";
		else if (req.query.sort === "created_at") sql += " ORDER BY created_at DESC";
		else sql += " ORDER BY created_at DESC";

		const [rows] = await db.promise().query(sql, vals);
		return res.json({ tasks: rows });
	} catch (err) {
		console.error("❌ getTasks:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const getTaskById = async (req, res) => {
	try {
		const id = req.params.id;
		const [rows] = await db.promise().query("SELECT * FROM Tasks WHERE task_id = ? LIMIT 1", [id]);
		const t = rows[0];
		if (!t) return res.status(404).json({ message: "Task not found" });
		return res.json({ task: t });
	} catch (err) {
		console.error("❌ getTaskById:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const updateTask = async (req, res) => {
	try {
		const id = req.params.id;
		const allowed = ["title_encrypted", "description_encrypted", "priority", "due_date", "category_id", "status"];
		const updates = [];
		const vals = [];

		for (const key of allowed) {
			if (req.body[key] !== undefined) {
				updates.push(`${key} = ?`);
				// convert due_date to DATETIME if present
				if (key === "due_date") vals.push(toMySQLDateTime(req.body[key]));
				else vals.push(req.body[key]);
			}
		}

		if (updates.length === 0) return res.status(400).json({ message: "No fields provided" });

		vals.push(id);
		const sql = `UPDATE Tasks SET ${updates.join(", ")} WHERE task_id = ?`;
		const [result] = await db.promise().query(sql, vals);

		// log activity with user_id fetched from task
		try {
			const [r] = await db.promise().query("SELECT user_id FROM Tasks WHERE task_id = ? LIMIT 1", [id]);
			const user_id = r[0]?.user_id ?? null;
			if (user_id) await logActivity(user_id, "update_task", "task", id, req.body);
		} catch (e) {}

		return res.json({ message: "Task updated", affectedRows: result.affectedRows });
	} catch (err) {
		console.error("❌ updateTask:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const patchTaskStatus = async (req, res) => {
	try {
		const id = req.params.id;
		const { status } = req.body;
		if (!["Pending", "Completed"].includes(status)) return res.status(400).json({ message: "Invalid status" });

		const [result] = await db.promise().query("UPDATE Tasks SET status = ? WHERE task_id = ?", [status, id]);

		// log
		try {
			const [r] = await db.promise().query("SELECT user_id FROM Tasks WHERE task_id = ? LIMIT 1", [id]);
			const user_id = r[0]?.user_id ?? null;
			if (user_id) await logActivity(user_id, "patch_task_status", "task", id, { status });
		} catch (e) {}

		return res.json({ message: "Status updated", affectedRows: result.affectedRows });
	} catch (err) {
		console.error("❌ patchTaskStatus:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const deleteTask = async (req, res) => {
	try {
		const id = req.params.id;
		const [rows] = await db.promise().query("SELECT user_id, title_encrypted FROM Tasks WHERE task_id = ? LIMIT 1", [id]);
		const t = rows[0];
		if (!t) return res.status(404).json({ message: "Task not found" });

		const [result] = await db.promise().query("DELETE FROM Tasks WHERE task_id = ?", [id]);

		await logActivity(t.user_id, "delete_task", "task", id, { title_encrypted: t.title_encrypted });

		return res.json({ message: "Task deleted" });
	} catch (err) {
		console.error("❌ deleteTask:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

/* ---------------------------
   Subtasks
   --------------------------- */

export const createSubtask = async (req, res) => {
	try {
		const { task_id, title_encrypted } = req.body;
		if (!task_id || !title_encrypted) return res.status(400).json({ message: "task_id and title_encrypted required" });

		const [result] = await db.promise().query("INSERT INTO Subtasks (task_id, title_encrypted) VALUES (?, ?)", [task_id, title_encrypted]);

		// log activity (resolve user_id from task)
		try {
			const [r] = await db.promise().query("SELECT user_id FROM Tasks WHERE task_id = ? LIMIT 1", [task_id]);
			const user_id = r[0]?.user_id ?? null;
			if (user_id) await logActivity(user_id, "create_subtask", "subtask", result.insertId, { task_id });
		} catch (e) {}

		return res.status(201).json({ subtask_id: result.insertId, message: "Subtask created" });
	} catch (err) {
		console.error("❌ createSubtask:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const getSubtasksByTask = async (req, res) => {
	try {
		const taskId = req.params.taskId;
		const [rows] = await db.promise().query("SELECT * FROM Subtasks WHERE task_id = ? ORDER BY created_at ASC", [taskId]);
		return res.json({ subtasks: rows });
	} catch (err) {
		console.error("❌ getSubtasksByTask:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const toggleSubtaskStatus = async (req, res) => {
	try {
		const id = req.params.id;
		const { status } = req.body;
		if (!["Pending", "Completed"].includes(status)) return res.status(400).json({ message: "Invalid status" });
		const [result] = await db.promise().query("UPDATE Subtasks SET status = ? WHERE subtask_id = ?", [status, id]);

		// log
		try {
			const [r] = await db.promise().query(
				"SELECT t.user_id FROM Subtasks s JOIN Tasks t ON s.task_id = t.task_id WHERE s.subtask_id = ? LIMIT 1",
				[id]
			);
			const user_id = r[0]?.user_id ?? null;
			if (user_id) await logActivity(user_id, "toggle_subtask_status", "subtask", id, { status });
		} catch (e) {}

		return res.json({ message: "Subtask status updated", affectedRows: result.affectedRows });
	} catch (err) {
		console.error("❌ toggleSubtaskStatus:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const deleteSubtask = async (req, res) => {
	try {
		const id = req.params.id;
		const [rows] = await db.promise().query("SELECT s.task_id, t.user_id FROM Subtasks s JOIN Tasks t ON s.task_id = t.task_id WHERE s.subtask_id = ? LIMIT 1", [id]);
		const meta = rows[0];
		if (!meta) return res.status(404).json({ message: "Subtask not found" });

		const [result] = await db.promise().query("DELETE FROM Subtasks WHERE subtask_id = ?", [id]);

		await logActivity(meta.user_id, "delete_subtask", "subtask", id, { task_id: meta.task_id });

		return res.json({ message: "Subtask deleted" });
	} catch (err) {
		console.error("❌ deleteSubtask:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};
