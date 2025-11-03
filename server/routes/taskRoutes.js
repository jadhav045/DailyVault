import express from "express";

import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";
import {
  createSubtask,
  updateSubtask,
  deleteSubtask,
  getSubtasks,
} from "../controllers/subtaskController.js";
import { verifyToken } from "../middleware/auth.middleware.js";
const router = express.Router();

// Protected routes — user must be authenticated
router.post("/", verifyToken, createTask);
router.get("/", verifyToken, getTasks);
router.get("/:id", verifyToken, getTaskById);
router.put("/:id", verifyToken, updateTask);
router.delete("/:id", verifyToken, deleteTask);

router.get("/:taskId/subtasks", verifyToken, getSubtasks);
router.post("/:taskId/subtasks", verifyToken, createSubtask);
router.put("/subtasks/:subtaskId", verifyToken, updateSubtask);
router.delete("/subtasks/:subtaskId", verifyToken, deleteSubtask);

export default router;
