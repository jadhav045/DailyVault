import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  deleteMultipleCategories,
} from "../controllers/categoryController.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken); // Apply authentication middleware to all routes

router.post("/", createCategory);              // Create
router.get("/", getCategories);                // Read all
router.put("/:id", updateCategory);            // Update
router.delete("/:id", deleteCategory);         // Delete one
router.delete("/", deleteMultipleCategories);  // Delete multiple

export default router;
