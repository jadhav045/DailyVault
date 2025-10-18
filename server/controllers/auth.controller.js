import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail.js";
import * as authService from "../services/auth.service.js";
import { generateOTPHtml } from "../utils/emailTemplates.js";

export const register = async (req, res) => {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password)
			return res.status(400).json({ message: "All fields are required." });

		const existing = await authService.findUserByEmail(email);
		if (existing) return res.status(400).json({ message: "User already exists." });

		const userId = await authService.createUser({ name, email, password });

		const generated_otp = authService.generateOTP();
		const expiryTime = authService.otpExpiryDate(5); // minutes
		await authService.setOTPForUserById(userId, generated_otp, expiryTime);

		const html = generateOTPHtml(generated_otp);
		await sendEmail(email, "Your Email Verification OTP", html);

		res.status(201).json({ message: "User registered. OTP sent for verification." });
	} catch (error) {
		console.error("❌ Error in register:", error);
		res.status(500).json({ message: "Internal server error." });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password)
			return res.status(400).json({ message: "Email and password required." });

		const user = await authService.findUserByEmail(email);
		if (!user) return res.status(404).json({ message: "User not found." });

		const isMatch = await bcrypt.compare(password, user.password_enc);
		if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

		const token = jwt.sign({ id: user.user_id, email: user.email_enc }, process.env.JWT_SECRET, { expiresIn: "1d" });
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

		const user = await authService.findUserByEmail(email);
		if (!user) return res.status(404).json({ message: "User not found" });

		const generated_otp = authService.generateOTP();
		const expiryTime = authService.otpExpiryDate(5);
		await authService.setOTPForUserByEmail(email, generated_otp, expiryTime);

		const html = generateOTPHtml(generated_otp);
		await sendEmail(email, "Your OTP Code", html);

		res.json({ message: "OTP sent successfully to your email." });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal Server Error" });
	}
};

export const verifyOTP = async (req, res) => {
	try {
		const { email, otp } = req.body;
		if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

		const user = await authService.findUserByEmail(email);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (!authService.verifyOTPValue(user, otp)) return res.status(400).json({ message: "Invalid or expired OTP" });

		await authService.clearOTPByEmail(email);
		return res.json({ message: "OTP verified successfully" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const updatePassword = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ message: "Email & updated password required" });

		const user = await authService.findUserByEmail(email);
		if (!user) return res.status(404).json({ message: "User not found" });

		const hashedPassword = await bcrypt.hash(password, 10);
		await authService.updatePasswordByEmail(email, hashedPassword);
		return res.json({ message: "Password updated successfully" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export const logout = async (req, res) => {
	res.json({ message: "Logout successful! Please remove token from client." });
};
