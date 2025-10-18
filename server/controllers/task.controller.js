import pool from "../config/db.config.js"; // Use the PostgreSQL pool
import jwt from "jsonwebtoken";

/* Helper: get user_id (UUID) from the request's JWT.
  This is simplified as our primary key for Users is now the UUID.
*/
async function getUserIdFromJwt(req) {
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      return payload?.id ?? payload?.user_id ?? null;
    } catch (e) {
      console.warn("Could not verify JWT:", e.message);
      return null; // Token is invalid or expired
    }
  }
  // Fallback for non-JWT requests if necessary
  return req.body.user_id ?? req.query.user_id ?? null;
}

/* Helper: Log an activity to the ActivityLog table.
 */
async function logActivity(user_id, action_type, details = null) {
  // Ensure user_id is provided
  if (!user_id) {
    console.warn("ActivityLog skipped: user_id was not provided.");
    return;
  }
  try {
    const sql = `
            INSERT INTO ActivityLog (user_id, action_type, diary_id, task_id) 
            VALUES ($1, $2, $3, $4)`;

    // Assumes details object might contain diary_id or task_id
    await pool.query(sql, [
      user_id,
      action_type,
      details?.diary_id ?? null,
      details?.task_id ?? null,
    ]);
  } catch (err) {
    // Fail silently if the log table doesn't exist or if there's an error
    console.warn("ActivityLog insert failed:", err.message);
  }
}

// =================================================================
// Categories
// =================================================================

export const createCategory = async (req, res) => {
  try {
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    console.log(req.body);
    const { category_name, color_code = "#FFFFFF" } = req.body;
    // const category_name = na
    // me;
    if (!category_name)
      return res.status(400).json({ message: "category_name is required" });

    const sql = `
            INSERT INTO Categories (user_id, category_name, color_code) 
            VALUES ($1, $2, $3) 
            RETURNING category_id`;

    const { rows } = await pool.query(sql, [
      user_id,
      category_name,
      color_code,
    ]);
    const newCategoryId = rows[0].category_id;

    await logActivity(user_id, "create", { task_id: newCategoryId });

    return res
      .status(201)
      .json({ category_id: newCategoryId, message: "Category created" });
  } catch (err) {
    console.error("❌ createCategory:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const { rows } = await pool.query(
      "SELECT * FROM Categories WHERE user_id = $1 ORDER BY category_name",
      [user_id]
    );
    return res.json({ categories: rows });
  } catch (err) {
    console.error("❌ getCategories:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const category_id = req.params.id;
    const { category_name, color_code } = req.body;

    const updates = [];
    const vals = [];
    let paramIndex = 1;

    if (category_name !== undefined) {
      updates.push(`category_name = $${paramIndex++}`);
      vals.push(category_name);
    }
    if (color_code !== undefined) {
      updates.push(`color_code = $${paramIndex++}`);
      vals.push(color_code);
    }

    if (updates.length === 0)
      return res.status(400).json({ message: "No fields to update" });

    vals.push(user_id, category_id); // Add user_id and category_id for the WHERE clause
    const sql = `
            UPDATE Categories SET ${updates.join(", ")} 
            WHERE user_id = $${paramIndex++} AND category_id = $${paramIndex++}`;

    const { rowCount } = await pool.query(sql, vals);
    if (rowCount === 0)
      return res.status(404).json({
        message: "Category not found or you do not have permission to edit it.",
      });

    await logActivity(user_id, "update", { task_id: category_id });

    return res.json({ message: "Category updated", affectedRows: rowCount });
  } catch (err) {
    console.error("❌ updateCategory:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const category_id = req.params.id;
    const { rowCount } = await pool.query(
      "DELETE FROM Categories WHERE category_id = $1 AND user_id = $2",
      [category_id, user_id]
    );

    if (rowCount === 0)
      return res.status(404).json({
        message:
          "Category not found or you do not have permission to delete it.",
      });

    await logActivity(user_id, "delete", { task_id: category_id });

    return res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("❌ deleteCategory:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// =================================================================
// Tasks
// =================================================================

export const createTask = async (req, res) => {
  try {
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const {
      category_id = null,
      priority_name = "Medium",
      due_date = null,
      status = "pending",
    } = req.body;

    // Fix encrypted field names
    const title_enc = req.body.title_encrypted || req.body.title_enc;
    const description_enc =
      req.body.description_encrypted || req.body.description_enc;

    if (!title_enc)
      return res.status(400).json({ message: "title_enc is required" });

    const sql = `
            INSERT INTO Tasks (user_id, category_id, title_enc, description_enc, priority_name, due_date, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING task_id`;

    const values = [
      user_id,
      category_id,
      title_enc,
      description_enc,
      priority_name,
      due_date,
      status,
    ];
    const { rows } = await pool.query(sql, values);
    const newTaskId = rows[0].task_id;

    await logActivity(user_id, "create", { task_id: newTaskId });

    return res
      .status(201)
      .json({ task_id: newTaskId, message: "Task created" });
  } catch (err) {
    console.error("❌ createTask:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTasks = async (req, res) => {
  try {
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    // console.log(user_id);
    let sql = "SELECT * FROM Tasks WHERE user_id = $1";
    const vals = [user_id];
    let paramIndex = 2;

    if (req.query.status) {
      sql += ` AND status = $${paramIndex++}`;
      vals.push(req.query.status);
    }
    if (req.query.category) {
      sql += ` AND category_id = $${paramIndex++}`;
      vals.push(req.query.category);
    }
    if (req.query.priority) {
      sql += ` AND priority_name = $${paramIndex++}`;
      vals.push(req.query.priority);
    }

    // NOTE: Server-side search on encrypted text ('title_enc') is not feasible.
    // This search logic should be handled on the client-side after decryption.

    if (req.query.sort === "due_date")
      sql += " ORDER BY due_date ASC NULLS LAST";
    else sql += " ORDER BY created_at DESC";

    const { rows } = await pool.query(sql, vals);

    // console.log("ROWS", rows[0]);
    return res.json({ tasks: rows });
  } catch (err) {
    console.error("❌ getTasks:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTaskById = async (req, res) => {
  try {
    console.log(req.body);
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const task_id = req.params.id;
    const { rows } = await pool.query(
      "SELECT * FROM Tasks WHERE task_id = $1 AND user_id = $2",
      [task_id, user_id]
    );

    const task = rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });
    return res.json({ task });
  } catch (err) {
    console.error("❌ getTaskById:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const task_id = req.params.id;
    // Update allowed fields array to match schema
    const allowed = [
      "title_enc",
      "description_enc",
      "priority_name",
      "due_date",
      "category_id",
      "status",
    ];

    // Handle encrypted field conversion if needed
    const updates = [];
    const vals = [];
    let paramIndex = 1;

    for (const key of allowed) {
      let value = req.body[key];
      // Convert any _encrypted fields to _enc
      if (key === "title_enc" && req.body.title_encrypted) {
        value = req.body.title_encrypted;
      }
      if (key === "description_enc" && req.body.description_encrypted) {
        value = req.body.description_encrypted;
      }
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex++}`);
        vals.push(value);
      }
    }

    if (updates.length === 0)
      return res.status(400).json({ message: "No fields to update" });

    vals.push(user_id, task_id);
    const sql = `
            UPDATE Tasks SET ${updates.join(", ")} 
            WHERE user_id = $${paramIndex++} AND task_id = $${paramIndex++}`;

    const { rowCount } = await pool.query(sql, vals);
    if (rowCount === 0)
      return res.status(404).json({
        message: "Task not found or you do not have permission to edit it.",
      });

    await logActivity(user_id, "update", { task_id });
    return res.json({ message: "Task updated", affectedRows: rowCount });
  } catch (err) {
    console.error("❌ updateTask:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const task_id = req.params.id;
    const { rowCount } = await pool.query(
      "DELETE FROM Tasks WHERE task_id = $1 AND user_id = $2",
      [task_id, user_id]
    );

    if (rowCount === 0)
      return res.status(404).json({
        message: "Task not found or you do not have permission to delete it.",
      });

    await logActivity(user_id, "delete", { task_id });
    return res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("❌ deleteTask:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// =================================================================
// Subtasks
// =================================================================

export const createSubtask = async (req, res) => {
  try {
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });
    console.log("ss");
    // Fix encrypted field name
    const task_id = req.body.task_id;
    const title_enc = req.body.title_encrypted || req.body.title_enc;

    if (!task_id || !title_enc)
      return res
        .status(400)
        .json({ message: "task_id and title_enc are required" });

    // Security Check: Ensure the parent task belongs to the user
    const { rows: taskCheck } = await pool.query(
      "SELECT task_id FROM Tasks WHERE task_id = $1 AND user_id = $2",
      [task_id, user_id]
    );
    if (taskCheck.length === 0)
      return res
        .status(403)
        .json({ message: "You do not own the parent task." });

    const sql = `
            INSERT INTO Subtasks (task_id, title_enc) 
            VALUES ($1, $2) 
            RETURNING subtask_id`;
    const { rows } = await pool.query(sql, [task_id, title_enc]);

    await logActivity(user_id, "create", { task_id: rows[0].subtask_id });
    return res
      .status(201)
      .json({ subtask_id: rows[0].subtask_id, message: "Subtask created" });
  } catch (err) {
    console.error("❌ createSubtask:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSubtasksByTask = async (req, res) => {
  try {
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const taskId = req.params.taskId;
    // Security Check: Join with tasks to ensure user owns the parent task
    const sql = `
            SELECT s.* FROM Subtasks s
            JOIN Tasks t ON s.task_id = t.task_id
            WHERE s.task_id = $1 AND t.user_id = $2
            ORDER BY s.created_at ASC`;

    const { rows } = await pool.query(sql, [taskId, user_id]);
    return res.json({ subtasks: rows });
  } catch (err) {
    console.error("❌ getSubtasksByTask:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const toggleSubtaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      // If 'status' is missing, it sends a 400 error
      return res.status(400).json({ message: "Status field is required." });
    }
    console.log("hh");
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const subtask_id = req.params.id;
    // const { status } = req.body;
    console.log("BPDY", req.body);
    if (!["pending", "completed"].includes(status))
      return res
        .status(400)
        .json({ message: "Invalid status, must be 'pending' or 'completed'" });

    // Security Check: Join to ensure user owns the parent task
    const sql = `
            UPDATE Subtasks s SET status = $1
            FROM Tasks t
            WHERE s.subtask_id = $2 AND s.task_id = t.task_id AND t.user_id = $3`;

    const { rowCount } = await pool.query(sql, [status, subtask_id, user_id]);
    if (rowCount === 0)
      return res.status(404).json({
        message: "Subtask not found or you do not have permission to edit it.",
      });

    await logActivity(user_id, "update", { task_id: subtask_id });
    return res.json({
      message: "Subtask status updated",
      affectedRows: rowCount,
    });
  } catch (err) {
    console.error("❌ toggleSubtaskStatus:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteSubtask = async (req, res) => {
  try {
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const subtask_id = req.params.id;

    // Security Check: Join to ensure user owns the parent task before deleting
    const sql = `
            DELETE FROM Subtasks s
            USING Tasks t
            WHERE s.subtask_id = $1 AND s.task_id = t.task_id AND t.user_id = $2`;

    const { rowCount } = await pool.query(sql, [subtask_id, user_id]);
    if (rowCount === 0)
      return res.status(404).json({
        message:
          "Subtask not found or you do not have permission to delete it.",
      });

    await logActivity(user_id, "delete", { task_id: subtask_id });
    return res.json({ message: "Subtask deleted" });
  } catch (err) {
    console.error("❌ deleteSubtask:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const patchTaskStatus = async (req, res) => {
  try {
    const user_id = await getUserIdFromJwt(req);
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const task_id = req.params.id;
    let { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });

    // Normalize status value (accept both "Pending"/"Completed" and "pending"/"completed")
    status = status.toLowerCase();
    if (status === "pending" || status === "completed") {
      // ok
    } else if (status === "Pending" || status === "Completed") {
      status = status.toLowerCase();
    } else {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const sql = `
      UPDATE Tasks
      SET status = $1
      WHERE task_id = $2 AND user_id = $3
      RETURNING *`;
    const { rowCount } = await pool.query(sql, [status, task_id, user_id]);
    if (rowCount === 0)
      return res.status(404).json({
        message: "Task not found or you do not have permission to update it.",
      });

    await logActivity(user_id, "update", { task_id });
    return res.json({ message: "Task status updated" });
  } catch (err) {
    console.error("❌ patchTaskStatus:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
