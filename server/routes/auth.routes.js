import express from "express";
import {
  register,
  login,
  sendOTP,
  verifyOTP,
  updatePassword,
  logout,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/sendOTP", sendOTP);
router.post("/verifyOTP", verifyOTP);
router.put("/updatePassword", updatePassword);
router.post("/logout", verifyToken, logout);

export default router;
