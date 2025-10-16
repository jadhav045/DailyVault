import express from "express";
import {
	createCategory,
	getCategories,
	updateCategory,
	deleteCategory,
	createTask,
	getTasks,
	getTaskById,
	updateTask,
	patchTaskStatus,
	deleteTask,
	createSubtask,
	getSubtasksByTask,
	toggleSubtaskStatus,
	deleteSubtask,
} from "../controllers/task.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

/* Categories */
router.post("/categories",  createCategory);
router.get("/categories",  getCategories);
router.put("/categories/:id",  updateCategory);
router.delete("/categories/:id",  deleteCategory);

/* Tasks */
router.post("/tasks",  createTask);
router.get("/tasks",  getTasks);
router.get("/tasks/:id",  getTaskById);
router.put("/tasks/:id",  updateTask);
router.patch("/tasks/:id/status",  patchTaskStatus);
router.delete("/tasks/:id",  deleteTask);

/* Subtasks */
router.post("/subtasks",  createSubtask);
router.get("/subtasks/task/:taskId",  getSubtasksByTask);
router.patch("/subtasks/:id/status",  toggleSubtaskStatus);
router.delete("/subtasks/:id",  deleteSubtask);

export default router;
