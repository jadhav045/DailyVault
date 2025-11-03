import db from "../config/db.js";

// ------------------ CREATE TASK ------------------
export const createTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { category_id, title, description, due_date, status, priority } =
      req.body;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const [result] = await db.query(
      `INSERT INTO Tasks (user_id, category_id, title, description, due_date, status, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        category_id || null,
        title,
        description || "",
        due_date || null,
        status || "pending",
        priority || "medium",
      ]
    );

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: {
        task_id: result.insertId,
        user_id,
        category_id,
        title,
        description,
        due_date,
        status,
        priority,
      },
    });
  } catch (error) {
    console.error("❌ Error creating task:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while creating task" });
  }
};

// ------------------ GET TASKS (with filters + subtasks) ------------------
export const getTasks = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { status, priority, category_id, due_date } = req.query;

    // Build base query for tasks
    let query = `SELECT * FROM Tasks WHERE user_id = ?`;
    const params = [user_id];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (priority) {
      query += ` AND priority = ?`;
      params.push(priority);
    }
    if (category_id) {
      query += ` AND category_id = ?`;
      params.push(category_id);
    }
    if (due_date) {
      query += ` AND due_date = ?`;
      params.push(due_date);
    }

    query += ` ORDER BY created_at DESC`;

    // 1️⃣ Fetch tasks
    const [tasks] = await db.query(query, params);

    if (!tasks.length) {
      return res.status(200).json({
        success: true,
        total: 0,
        tasks: [],
      });
    }

    // 2️⃣ Get all task IDs
    const taskIds = tasks.map((t) => t.task_id);

    // 3️⃣ Fetch subtasks for all those task IDs in a single query
    const [subtasks] = await db.query(
      `SELECT * FROM Subtasks WHERE task_id IN (?) ORDER BY created_at ASC`,
      [taskIds]
    );

    // 4️⃣ Group subtasks by task_id
    const subtaskMap = {};
    for (const subtask of subtasks) {
      if (!subtaskMap[subtask.task_id]) subtaskMap[subtask.task_id] = [];
      subtaskMap[subtask.task_id].push(subtask);
    }

    // 5️⃣ Attach subtasks to their corresponding tasks
    const tasksWithSubtasks = tasks.map((task) => ({
      ...task,
      subtasks: subtaskMap[task.task_id] || [],
    }));

    // 6️⃣ Send final response
    res.status(200).json({
      success: true,
      total: tasksWithSubtasks.length,
      tasks: tasksWithSubtasks,
    });
  } catch (error) {
    console.error("❌ Error fetching tasks (with subtasks):", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tasks and subtasks",
    });
  }
};

// ------------------ GET SINGLE TASK (with subtasks) ------------------
export const getTaskById = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id: task_id } = req.params;

    // 1️⃣ Fetch the main task
    const [taskRows] = await db.query(
      `SELECT * FROM Tasks WHERE task_id = ? AND user_id = ?`,
      [task_id, user_id]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found or does not belong to this user",
      });
    }

    const task = taskRows[0];

    // 2️⃣ Fetch subtasks linked to this task
    const [subtasks] = await db.query(
      `SELECT * FROM Subtasks WHERE task_id = ? ORDER BY created_at ASC`,
      [task_id]
    );

    // 3️⃣ Attach subtasks to the task object
    task.subtasks = subtasks || [];

    // 4️⃣ Send final response
    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("❌ Error fetching task with subtasks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching task details",
    });
  }
};

// ------------------ UPDATE TASK ------------------
export const updateTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    const { category_id, title, description, due_date, status, priority } =
      req.body;

      console.log("Updating task:", id, req.body);
    const [result] = await db.query(
      `UPDATE Tasks SET
         category_id = ?,
         title = ?,
         description = ?,
         due_date = ?,
         status = ?,
         priority = ?
       WHERE task_id = ? AND user_id = ?`,
      [
        category_id || null,
        title,
        description || "",
        due_date || null,
        status || "pending",
        priority || "medium",
        id,
        user_id,
      ]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    res
      .status(200)
      .json({ success: true, message: "Task updated successfully" });
  } catch (error) {
    console.error("❌ Error updating task:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while updating task" });
  }
};

// ------------------ DELETE TASK ------------------
export const deleteTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const [result] = await db.query(
      `DELETE FROM Tasks WHERE task_id = ? AND user_id = ?`,
      [id, user_id]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    res
      .status(200)
      .json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while deleting task" });
  }
};
