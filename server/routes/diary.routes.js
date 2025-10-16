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

router.post("/", createEntry);
router.get("/",  getEntries);
router.get("/moods/stats",  getMoodStats);
router.get("/date/:date",  getEntriesByDate);
router.get("/tags/:tag",  getEntriesByTag);
router.get("/search",  searchEntries);
router.get("/:entry_id",  getEntryById);
router.put("/:entry_id",  updateEntry);
router.delete("/:entry_id",  deleteEntry);
router.get("/missing", getMissingDiaryDates);

export default router;
