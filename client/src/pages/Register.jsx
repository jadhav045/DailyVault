import React, { useState } from "react";
import api from "../api/api";
import AuthForm from "../components/AuthForm";
import AuthInput from "../components/AuthInput";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext"; // Import your custom toast hook

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast(); // Toast handler

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/register", form);
      showToast(res.data.message || "OTP sent to your email!", "success");

      // Automatically redirect to OTP verification with email context
      setTimeout(() => {
        navigate("/verify-email", { state: { email: form.email } });
      }, 1000);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Registration failed. Try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm title="Create Account" onSubmit={handleSubmit} loading={loading}>
      <AuthInput
        label="Username"
        name="username"
        value={form.username}
        onChange={handleChange}
      />
      <AuthInput
        label="Email"
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
      />
      <AuthInput
        label="Password"
        type="password"
        name="password"
        value={form.password}
        onChange={handleChange}
      />

      <p className="text-center text-gray-500 text-sm mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Login
        </Link>
      </p>
    </AuthForm>
  );
}
