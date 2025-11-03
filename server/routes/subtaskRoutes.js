import express from "express";
import {
  getSubtasksByTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
} from "../controllers/subtaskController.js";
import { verifyToken } from "../middleware/auth.middleware.js";
// import { verifyToken } from "../middleware/verifyToken.js";


router.get("/:taskId/subtasks", verifyToken, getSubtasksByTask);
router.post("/:taskId/subtasks", verifyToken, createSubtask);
router.put("/subtasks/:subtaskId", verifyToken, updateSubtask);
router.delete("/subtasks/:subtaskId", verifyToken, deleteSubtask);

export default router;
