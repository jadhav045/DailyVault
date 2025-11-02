import { verifyOTP } from "../controllers/auth.controller.js";
// import {
//   createSubtask,
//   deleteSubtask,
//   getSubtasksByTask,
//   toggleSubtaskStatus,
// } from "../controllers/task.controller.js";
import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
const router = express.Router();

// /* Subtasks */
// router.post("/", createSubtask);
// router.get("/task/:taskId", getSubtasksByTask);
// router.patch("/:id/status", verifyToken, toggleSubtaskStatus);
// router.delete("/:id", deleteSubtask);
export default router;
