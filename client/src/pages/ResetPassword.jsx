import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api.js";

export default function ResetPassword() {
  const { state } = useLocation();
  const email = state?.email;
  const navigate = useNavigate();

  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email,
        newPassword: passwords.newPassword,
      });
      alert(res.data.message || "Password reset successful!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    navigate("/forgot-password");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-50 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Reset Your Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={passwords.newPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={passwords.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-60"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
