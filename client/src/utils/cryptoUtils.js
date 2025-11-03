// src/utils/cryptoUtils.js
// Secure AES-GCM encryption/decryption utilities using Web Crypto API

// Convert string to ArrayBuffer
function strToBuffer(str) {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to Base64
function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Convert Base64 to ArrayBuffer
function base64ToBuffer(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

// Derive a strong AES key from a password using PBKDF2
export async function deriveKey(password, salt = "app-static-salt") {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    strToBuffer(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: strToBuffer(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return key;
}

// Encrypt text with derived key
export async function encryptText(text, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encoded = strToBuffer(text);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  return {
    data: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
  };
}

// Decrypt text with derived key
export async function decryptText(encrypted, key) {
  const iv = base64ToBuffer(encrypted.iv);
  const ciphertext = base64ToBuffer(encrypted.data);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
