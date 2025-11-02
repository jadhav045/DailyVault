import express from "express";
import {

	createTask,


} from "../controllers/task.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

/* Tasks */
router.post("/",  createTask);

export default router;
