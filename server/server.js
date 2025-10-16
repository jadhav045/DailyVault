import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js"; // <-- added
import diaryRoutes from "./routes/diary.routes.js"
import "./config/db.config.js";

dotenv.config();

import "./config/db.config.js"; // DB reads from .env
console.log(process.env.DB_HOST)

const app = express();

app.use(cors());
app.use(express.json());

// Mount API routers
app.use("/api", taskRoutes); // categories => /api/categories, tasks => /api/tasks, subtasks => /api/subtasks

app.use("/api/auth", authRoutes);
app.use("/api/diary", diaryRoutes)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
