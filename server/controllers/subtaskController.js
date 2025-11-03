import db from "../config/db.js";

// ✅ Get all subtasks for a task
export const getSubtasks = async (req, res) => {
  const { taskId } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM Subtasks WHERE task_id = ? ORDER BY created_at ASC",
      [taskId]
    );

    res.status(200).json({
      success: true,
      total: rows.length,
      subtasks: rows,
    });
  } catch (error) {
    console.error("❌ Error fetching subtasks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching subtasks",
    });
  }
};

// ✅ Create a new subtask
export const createSubtask = async (req, res) => {
  const { taskId } = req.params;
  const { title } = req.body;

  if (!title)
    return res
      .status(400)
      .json({ success: false, message: "Title is required" });

  try {
    const [result] = await db.query(
      "INSERT INTO Subtasks (task_id, title) VALUES (?, ?)",
      [taskId, title]
    );

    res.status(201).json({
      success: true,
      message: "Subtask created successfully",
      subtask: {
        subtask_id: result.insertId,
        task_id: taskId,
        title,
        is_completed: false,
      },
    });
  } catch (error) {
    console.error("❌ Error creating subtask:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error creating subtask" });
  }
};

export const updateSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { title, is_completed } = req.body;

    const [result] = await db.query(
      `UPDATE Subtasks SET title = COALESCE(?, title), is_completed = COALESCE(?, is_completed)
       WHERE subtask_id = ?`,
      [title, is_completed, subtaskId]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Subtask not found" });

    // Fetch the updated subtask to send back
    const [updatedRows] = await db.query(
      `SELECT * FROM Subtasks WHERE subtask_id = ?`,
      [subtaskId]
    );

    res.status(200).json({
      success: true,
      subtask: updatedRows[0],
    });
  } catch (error) {
    console.error("❌ Error updating subtask:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating subtask",
    });
  }
};

// ✅ Delete a subtask
export const deleteSubtask = async (req, res) => {
  const { subtaskId } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM Subtasks WHERE subtask_id = ?",
      [subtaskId]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Subtask not found" });

    res
      .status(200)
      .json({ success: true, message: "Subtask deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting subtask:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error deleting subtask" });
  }
};
