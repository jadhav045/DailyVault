// Web Crypto helpers for password-based AES-GCM encryption

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bufToBase64(buf) {
	let binary = "";
	const bytes = new Uint8Array(buf);
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}

function base64ToBuf(b64) {
	const binary = atob(b64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}

async function deriveKey(password, salt) {
	const keyMaterial = await window.crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
	return window.crypto.subtle.deriveKey(
		{ name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"]
	);
}

/**
 * Encrypt plaintext with a password.
 * Returns a base64 package containing: salt(16) + iv(12) + ciphertext
 */
export async function encryptData(password, plain) {
	const salt = window.crypto.getRandomValues(new Uint8Array(16));
	const iv = window.crypto.getRandomValues(new Uint8Array(12));
	const key = await deriveKey(password, salt);
	const ct = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plain));
	// package: salt + iv + ct (base64)
	const combined = new Uint8Array(salt.byteLength + iv.byteLength + ct.byteLength);
	combined.set(salt, 0);
	combined.set(iv, salt.byteLength);
	combined.set(new Uint8Array(ct), salt.byteLength + iv.byteLength);
	return bufToBase64(combined.buffer);
}

/**
 * Decrypts package produced by encryptData with same password.
 * Expects base64 of salt(16) + iv(12) + ciphertext
 */
export async function decryptData(password, packageB64) {
	try {
		const buf = base64ToBuf(packageB64);
		const all = new Uint8Array(buf);
		const salt = all.slice(0, 16);
		const iv = all.slice(16, 28);
		const ct = all.slice(28).buffer;
		const key = await deriveKey(password, salt);
		const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
		return decoder.decode(decrypted);
	} catch (e) {
		throw new Error("Decryption failed");
	}
}
