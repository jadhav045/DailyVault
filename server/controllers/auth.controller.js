import db from "../config/db.config.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { escape } from "mysql2";
import { sendEmail } from "../utils/sendEmail.js";

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // ✅ Validate input
        if (!name || !email || !password)
            return res.status(400).json({ message: "All fields are required." });

        // ✅ Check if user already exists
        const [existing] = await db
            .promise()
            .query("SELECT * FROM users WHERE email = ?", [email]);

        if (existing.length > 0)
            return res.status(400).json({ message: "User already exists." });

        // ✅ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Insert new user and capture inserted id
        const [insertResult] = await db
            .promise()
            .query("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [
                name,
                email,
                hashedPassword,
            ]);

        const newUserId = insertResult.insertId;

        // ✅ Generate a 6-digit OTP for email verification
        const generated_otp = Math.floor(100000 + Math.random() * 900000);
        const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Update the newly created user with OTP and expiry
        await db
            .promise()
            .query("UPDATE users SET otp = ?, otp_expires_at = ? WHERE user_id = ?", [
                generated_otp,
                expiryTime,
                newUserId,
            ]);

        // 5️⃣ Send OTP email
        const html = `
      <div style="font-family:sans-serif; padding:10px;">
        <h2>BuddyBudget - Email Verification</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="color:#2b6cb0">${generated_otp}</h1>
        <p>This OTP is valid for <b>5 minutes</b>.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

        await sendEmail(email, "Your BuddyBudget Email Verification OTP", html);

        // Respond that registration succeeded and OTP was sent
        res.status(201).json({ message: "User registered. OTP sent to your email for verification." });
    } catch (error) {
        console.error("❌ Error in register:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Data", req.body);
        // ✅ Validate input
        if (!email || !password)
            return res.status(400).json({ message: "Email and password required." });

        // ✅ Find user
        const [rows] = await db
            .promise()
            .query("SELECT * FROM users WHERE email = ?", [email]);

        const user = rows[0];
        if (!user)
            return res.status(404).json({ message: "User not found." });

        // ✅ Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials." });

        // ✅ Generate JWT token (include common id claim names for clients)
        // Use user.id (from DB) — avoid undefined user.user_id
        const token = jwt.sign(
            {
                id: user.user_id,
                email: user.email,
                // include alternative claim names so various clients/parsers can find the id easily
                sub: String(user.id),
                // user_id: user.id,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.json({ message: "Login successful!", token });
    } catch (error) {
        console.error("❌ Error in login:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};




export const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email required" });

        // 1️⃣ Check if user exists
        const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
        const user = rows[0];
        if (!user) return res.status(404).json({ message: "User not found" });

        // 2️⃣ Generate a 6-digit OTP
        const generated_otp = Math.floor(100000 + Math.random() * 900000);

        // 3️⃣ Set expiry time (5 minutes from now)
        const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

        // 4️⃣ Update user record with OTP and expiry
        await db
            .promise()
            .query("UPDATE users SET otp = ?, otp_expires_at = ? WHERE email = ?", [
                generated_otp,
                expiryTime,
                email,
            ]);

        // 5️⃣ Send OTP email
        const html = `
      <div style="font-family:sans-serif; padding:10px;">
        <h2>BuddyBudget - OTP Verification</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="color:#2b6cb0">${generated_otp}</h1>
        <p>This OTP is valid for <b>5 minutes</b>.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

        await sendEmail(email, "Your BuddyBudget OTP Code", html);

        res.json({ message: "OTP sent successfully to your email." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP required" });
        }

        const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
        const user = rows[0];
        if (!user) return res.status(404).json({ message: "User not found" });

        // Compare OTP and expiry (compare as strings to avoid type issues)
        if (String(user.otp) !== String(otp)) return res.status(400).json({ message: "Invalid OTP" });
        if (new Date() > new Date(user.otp_expires_at))
            return res.status(400).json({ message: "OTP expired" });

        // Clear OTP fields
        await db.promise().query("UPDATE users SET otp = NULL, otp_expires_at = NULL WHERE email = ?", [email]);

        // Try to mark the user as verified if the column exists. Ignore errors if it doesn't.
        try {
            await db.promise().query("UPDATE users SET is_verified = 1 WHERE email = ?", [email]);
        } catch (e) {
            // ignore if is_verified column doesn't exist
            console.warn("is_verified column not updated (maybe missing):", e.message);
        }

        return res.json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};



export const updatePassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("h")
        // 1️⃣ Validate input
        if (!email || !password)
            return res.status(400).json({ message: "Email & updated password required" });

        // 2️⃣ Check if user exists
        const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
        const user = rows[0];
        if (!user) return res.status(404).json({ message: "User not found" });

        // 3️⃣ Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4️⃣ Update password in DB
        await db
            .promise()
            .query("UPDATE users SET password_hash = ? WHERE email = ?", [hashedPassword, email]);

        // 5️⃣ Optional: Clear OTP after password update
        await db
            .promise()
            .query("UPDATE users SET otp = NULL, otp_expires_at = NULL WHERE email = ?", [email]);

        return res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};



export const updateProfile = async (req, res) => {
    try {

    } catch (error) {

    }
}

export const logout = async (req, res) => {
    try {
        // Since JWT is stateless, the backend can’t directly “invalidate” the token.
        // So we simply ask the client to delete it (from localStorage, cookies, etc.)
        // Optionally, you can maintain a token blacklist in DB/Redis for extra security.

        const authHeader = req.headers.authorization;

        // ✅ Check if token is provided
        if (!authHeader)
            return res.status(400).json({ message: "No token provided." });

        const token = authHeader.split(" ")[1];
        if (!token)
            return res.status(400).json({ message: "Invalid token format." });

        // Optionally, if using a blacklist:
        // await db.promise().query("INSERT INTO token_blacklist (token) VALUES (?)", [token]);

        res.json({ message: "Logout successful! Please remove token from client." });
    } catch (error) {
        console.error("❌ Error in logout:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
