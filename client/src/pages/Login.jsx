import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import AuthForm from "../components/AuthForm";
import AuthInput from "../components/AuthInput";
import { useToast } from "../context/ToastContext"; // Import the toast hook

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast(); // Use toast context

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      showToast("Login successful! Redirecting...", "success");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      if (err.response?.data?.unverified) {
        showToast("Email not verified. Redirecting...", "info");
        setTimeout(() => navigate("/verify-email", { state: { email: form.email } }), 1000);
      } else {
        showToast(err.response?.data?.message || "Login failed.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm title="Login" onSubmit={handleSubmit} loading={loading}>
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

      <div className="text-center text-sm mt-3">
        <Link to="/forgot-password" className="text-blue-600 hover:underline">
          Forgot Password?
        </Link>
      </div>

      <p className="text-center text-gray-500 text-sm mt-4">
        Don’t have an account?{" "}
        <Link to="/register" className="text-blue-600 hover:underline">
          Register
        </Link>
      </p>
    </AuthForm>
  );
}
