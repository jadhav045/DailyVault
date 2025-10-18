import pool from "../config/db.config.js";
import bcrypt from "bcryptjs";

/* DB helpers */
export async function findUserByEmail(email) {
	const { rows } = await pool.query("SELECT * FROM Users WHERE email_enc = $1", [email]);
	return rows[0] ?? null;
}

export async function createUser({ name, email, password }) {
	// password is plaintext here; we hash before insert
	const hashed = await bcrypt.hash(password, 10);
	const { rows } = await pool.query(
		"INSERT INTO Users (username_enc, email_enc, password_enc) VALUES ($1, $2, $3) RETURNING user_id",
		[name, email, hashed]
	);
	return rows[0]?.user_id;
}

export async function setOTPForUserById(userId, otp, expiresAt) {
	await pool.query("UPDATE Users SET otp = $1, otp_expires_at = $2 WHERE user_id = $3", [otp, expiresAt, userId]);
}
export async function setOTPForUserByEmail(email, otp, expiresAt) {
	await pool.query("UPDATE Users SET otp = $1, otp_expires_at = $2 WHERE email_enc = $3", [otp, expiresAt, email]);
}
export async function clearOTPByEmail(email) {
	await pool.query("UPDATE Users SET otp = NULL, otp_expires_at = NULL WHERE email_enc = $1", [email]);
}
export async function updatePasswordByEmail(email, hashedPassword) {
	await pool.query("UPDATE Users SET password_enc = $1 WHERE email_enc = $2", [hashedPassword, email]);
}

/* OTP helpers */
export function generateOTP() {
	return Math.floor(100000 + Math.random() * 900000);
}
export function otpExpiryDate(minutes = 5) {
	return new Date(Date.now() + minutes * 60 * 1000);
}
export function verifyOTPValue(user, otp) {
	if (!user) return false;
	if (String(user.otp) !== String(otp)) return false;
	if (!user.otp_expires_at) return false;
	return new Date() <= new Date(user.otp_expires_at);
}
