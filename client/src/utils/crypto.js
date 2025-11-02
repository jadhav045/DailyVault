// Web Crypto helpers for password-based AES-GCM encryption

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bufToBase64(buf) {
	// ArrayBuffer -> base64
	let binary = "";
	const bytes = new Uint8Array(buf);
	for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}

function base64ToBuf(base64) {
	const binary = atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}

async function deriveKeyFromSecret(secret, salt) {
	const keyMaterial = await window.crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "PBKDF2" },
		false,
		["deriveKey"]
	);
	return window.crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt,
			iterations: 250000,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"]
	);
}

/**
 * Encrypt a JS object (JSON) using a secret (e.g., user's UUID).
 * Returns a base64 string package: base64(salt(16) + iv(12) + ciphertext)
 *
 * Usage:
 *   const boxed = await encryptPayload(secret, { title, body });
 *   // send boxed to backend as opaque string
 */
export async function encryptData(secret, obj) {
	if (!secret) throw new Error("Secret required for encryption");
	const plaintext = JSON.stringify(obj);
	const salt = window.crypto.getRandomValues(new Uint8Array(16));
	const iv = window.crypto.getRandomValues(new Uint8Array(12));
	const key = await deriveKeyFromSecret(secret, salt);
	const ct = await window.crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		encoder.encode(plaintext)
	);
	// package: salt + iv + ct
	const combined = new Uint8Array(salt.byteLength + iv.byteLength + ct.byteLength);
	combined.set(salt, 0);
	combined.set(iv, salt.byteLength);
	combined.set(new Uint8Array(ct), salt.byteLength + iv.byteLength);
	return bufToBase64(combined.buffer);
}

/**
 * Decrypt a base64 package produced by encryptPayload and return the original object.
 * Throws on decryption failure.
 *
 * Usage:
 *   const obj = await decryptPayload(secret, boxed);
 */
export async function decryptData(secret, base64Package) {
	if (!secret) throw new Error("Secret required for decryption");
	try {
		const buf = base64ToBuf(base64Package);
		const all = new Uint8Array(buf);
		const salt = all.slice(0, 16);
		const iv = all.slice(16, 28);
		const ciphertext = all.slice(28).buffer;
		const key = await deriveKeyFromSecret(secret, salt);
		const plainBuf = await window.crypto.subtle.decrypt(
			{ name: "AES-GCM", iv },
			key,
			ciphertext
		);
		const plaintext = decoder.decode(plainBuf);
		return JSON.parse(plaintext);
	} catch (err) {
		// rethrow with clear message for callers
		throw new Error("Decryption failed or data corrupted");
	}
}

/*
Example usage patterns (client-side):

// Encrypt before send
const payload = { title: "My secret", content: "<p>...</p>" };
const boxed = await encryptPayload(userUuid, payload);
await api.post("/api/entries", { user_uuid: userUuid, content_encrypted: boxed });

// Decrypt after receive
const entry = await api.get("/api/entries/123");
const data = await decryptPayload(userUuid, entry.data.content_encrypted);
console.log(data.title, data.content);
*/
