import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import "./config/db.js"; // ✅ Auto-initializes the DB connection + schema

// dotenv.config();

const app = express();

// ✅ Fix: define PORT after dotenv.config()
const PORT = process.env.PORT || 5000;

// ✅ Updated CORS Configuration
app.use(
  cors({
    origin: "*", // For production: replace "*" with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Body Parser
app.use(express.json());

// --- Mount Routers ---
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/categories", categoryRoutes);
// ✅ Health check route
app.get("/", (req, res) => {
  res.send("🚀 Server is running and DB initialized successfully!");
});

// ✅ Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
