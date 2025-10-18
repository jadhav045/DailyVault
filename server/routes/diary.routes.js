import express from "express";
import {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  getMoodStats,
  getEntriesByDate,
  getEntriesByTag,
  searchEntries,
  getMissingDiaryDates,
} from "../controllers/diaryController.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, createEntry);
router.get("/", verifyToken, getEntries);
router.get("/moods/stats", verifyToken, getMoodStats);
router.get("/date/:date", verifyToken, getEntriesByDate);
router.get("/tags/:tag", verifyToken, getEntriesByTag);
router.get("/search", verifyToken, searchEntries);
router.get("/:entry_id", verifyToken, getEntryById);
router.put("/:entry_id", verifyToken, updateEntry);
router.delete("/:entry_id", verifyToken, deleteEntry);
router.get("/missing", verifyToken, getMissingDiaryDates);

export default router;
