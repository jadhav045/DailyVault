import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import AuthForm from "../components/AuthForm";
import AuthInput from "../components/AuthInput";
import { useToast } from "../context/ToastContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      showToast(res.data.message || "OTP sent to reset your password.", "success");
      navigate("/verify-email", { state: { email, fromReset: true } });
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm title="Forgot Password" onSubmit={handleSubmit} loading={loading}>
      <AuthInput
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <p className="text-center text-gray-500 text-sm mt-4">
        Remember your password?{" "}
        <span
          onClick={() => navigate("/login")}
          className="text-blue-600 hover:underline cursor-pointer"
        >
          Back to Login
        </span>
      </p>
    </AuthForm>
  );
}
