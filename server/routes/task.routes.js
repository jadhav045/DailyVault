import express from "express";
import {

	createTask,
	getTasks,
	getTaskById,
	updateTask,
	// patchTaskStatus,
	deleteTask,
	patchTaskStatus,

} from "../controllers/task.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

/* Tasks */
router.post("/",  createTask);
router.get("/", verifyToken, getTasks);
router.get("/:id",  getTaskById);
router.put("/:id",  updateTask);
router.patch("/:id/status",  patchTaskStatus);
router.delete("/:id",  deleteTask);


export default router;
