import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { sendEmail } from "../utils/sendEmail.js";
import { generateOtp } from "../utils/generateOTP.js";
import db from "../config/db.js";

const OTP_EXPIRY_MINUTES = 10;

// Helper to get current timestamp in MySQL format
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

// ------------------ REGISTER ------------------
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

    if (rows.length > 0) {
      const user = rows[0];
      if (user.is_verified) {
        return res.status(400).json({ message: "Email already registered" });
      } else {
        await db.query(
          "UPDATE Users SET otp=?, otp_expires_at=? WHERE email=?",
          [otpHash, otpExpires, email]
        );
        await sendEmail(email, `Your verification OTP: ${otp}`);
        return res.json({ message: "OTP resent. Please verify your email." });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await db.query(
      "INSERT INTO Users (user_id, username, email, password_hash, otp, otp_expires_at) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, username, email, passwordHash, otpHash, otpExpires]
    );

    await sendEmail(email, `Your verification OTP: ${otp}`);
    res
      .status(201)
      .json({ message: "User created. OTP sent for verification." });
  } catch (err) {
    console.error(err);

    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ VERIFY OTP ------------------
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const [rows] = await db.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(otp, user.otp);
    const isExpired = new Date() > new Date(user.otp_expires_at);

    console.log("OTP Match:", isMatch, "OTP Expired:", isExpired);
    console.log(
      "Provided OTP:",
      otp,
      "Stored OTP Hash:",
      user.otp,
      "Expires At:",
      user.otp_expires_at
    );
    if (!isMatch || isExpired) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await db.query(
      "UPDATE Users SET is_verified=TRUE, otp=NULL, otp_expires_at=NULL WHERE email=?",
      [email]
    );

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ LOGIN ------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(400).json({ message: "Invalid email or password" });

    const user = rows[0];
    if (!user.is_verified) {
      // Resend OTP
      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);
      const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);
      await db.query("UPDATE Users SET otp=?, otp_expires_at=? WHERE email=?", [
        otpHash,
        otpExpires,
        email,
      ]);
      await sendEmail(email, `Your verification OTP: ${otp}`);
      return res
        .status(400)
        .json({ message: "Email not verified. OTP resent." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("Password Match:", isMatch);
    console.log(
      "Provided Password:",
      password,
      "Stored Hash:",
      user.password_hash
    );
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user.user_id }, // payload → what’s inside the token
      process.env.JWT_SECRET, // secret key to sign and verify token
      { expiresIn: "10d" } // token validity duration
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ FORGOT PASSWORD ------------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const [rows] = await db.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const user = rows[0];
    if (!user.is_verified)
      return res.status(400).json({ message: "Email not verified" });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

    await db.query("UPDATE Users SET otp=?, otp_expires_at=? WHERE email=?", [
      otpHash,
      otpExpires,
      email,
    ]);
    await sendEmail(email, `Your password reset OTP: ${otp}`);

    res.json({ message: "OTP sent to your email for password reset." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ RESET PASSWORD ------------------
export const resetPassword = async (req, res) => {
  try {
    console.log("Reset Password Request Body:", req.body);
    const { email, newPassword } = req.body;
    const [rows] = await db.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const user = rows[0];
    // const isMatch = await bcrypt.compare(otp, user.otp);
    // const isExpired = new Date() > new Date(user.otp_expires_at);

    // if (!isMatch || isExpired) {
    //   return res.status(400).json({ message: "Invalid or expired OTP" });
    // }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE Users SET password_hash=?, otp=NULL, otp_expires_at=NULL WHERE email=?",
      [passwordHash, email]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Validate email
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // 2. Check if user exists
    const [users] = await db.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // // 3. Check if user is already verified
    // if (user.is_verified) {
    //   return res.status(400).json({ message: "User already verified" });
    // }

    // 4. Prevent resending too frequently (e.g., within 1 minute)
    const lastSent = new Date(user.otp_expires_at);
    const now = new Date();
    const diff = (now - lastSent) / 1000; // seconds

    if (diff < 60) {
      return res.status(429).json({
        message: `Please wait ${
          60 - Math.floor(diff)
        } seconds before requesting a new OTP.`,
      });
    }

    // 5. Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    // 6. Update OTP in DB
    await db.query(
      "UPDATE Users SET otp = ?, otp_expires_at = ? WHERE email = ?",
      [hashedOtp, otpExpiresAt, email]
    );

    // 7. Send OTP to user via email
    await sendEmail({
      to: email,
      subject: "Your Verification Code (OTP)",
      text: `Your new OTP is ${otp}. It will expire in 10 minutes.`,
    });

    return res.status(200).json({
      message: "OTP resent successfully. Please check your email.",
    });
  } catch (error) {
    console.error("Error in resendOtp:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const testEndpoint = (req, res) => {
  try {
    console.log("Test endpoint accessed by user:", req.user);
    const users = db.query("SELECT * FROM Users");

    res.status(200).json({ message: "Test endpoint is working!", users });
  } catch (error) {}
};
