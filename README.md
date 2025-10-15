# 🔒 DailyVault

**DailyVault** is a privacy-focused web application that lets you write your daily diary and manage to-dos — fully protected with **end-to-end encryption (E2EE)**.  
Only you can read what you write. Even the server cannot decrypt your data.

---

## ✨ Features
- 🧠 Write and store diary entries securely
- ✅ Manage personal to-do lists
- 🔐 End-to-End Encryption (AES-GCM in browser)
- ☁️ Data stored securely in MySQL via Node.js backend
- 💬 Decryption happens only on your device
- 🚫 Zero-knowledge backend — your data stays private

---

## 🏗️ Tech Stack
**Frontend:** React, JavaScript, Web Crypto API  
**Backend:** Node.js, Express.js  
**Database:** MySQL  
**Encryption:** AES-GCM, PBKDF2 (password-based key derivation)

---

## 🔧 How It Works
1. User writes a diary entry or to-do item.
2. React encrypts the text locally using AES-GCM before sending.
3. Encrypted data (ciphertext + IV + salt) is stored in MySQL.
4. When fetched, data is decrypted locally again using the same password.

> 💡 The server never sees or stores your encryption key or plaintext — total end-to-end privacy.

---

## 🚀 Setup
1. Clone the repository  
   ```bash
   git clone https://github.com/yourusername/cipherdiary.git
   cd cipherdiary
