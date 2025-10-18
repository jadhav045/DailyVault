import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import diaryRoutes from "./routes/diary.routes.js";
import subtaskRoutes from "./routes/subtask.routes.js";
import caterogoryRoutes from "./routes/category.routes.js";

import "./config/db.config.js"; // This initializes the DB connection

dotenv.config();

const app = express();

// ✅ Updated CORS Configuration
// This explicitly allows requests from any origin (*) and specifies common methods.
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// --- Mount API Routers ---

// Requests to /api/auth/... will be handled by authRoutes
app.use("/api/auth", authRoutes);

// Requests to /api/diary/... will be handled by diaryRoutes
app.use("/api/diary", diaryRoutes);

// Requests to /api/tasks, /api/categories, etc., will be handled by taskRoutes
// app.use("/api", taskRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/subtasks", subtaskRoutes);
app.use("/api/categories", caterogoryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
