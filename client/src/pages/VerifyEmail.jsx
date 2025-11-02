import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import OtpInput from "../components/OtpInput";
import { useToast } from "../context/ToastContext"; // Toast context

export default function VerifyEmail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!email) navigate("/register");
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    let interval;
    if (resendDisabled && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [resendDisabled, timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/verify", { email, otp: otp.join("") });
      navigate("/reset-password", { state: { email } });
      showToast(res.data.message || "Email verified successfully!", "success");
      // setTimeout(() => navigate("/login"), 1000);

      
    } catch (err) {
      showToast(err.response?.data?.message || "OTP verification failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendDisabled) return;
    try {
      await api.post("/auth/resend-otp", { email });
      showToast("New OTP sent!", "info");
      setResendDisabled(true);
      setTimer(60);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to resend OTP.", "error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-50 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 transition-transform transform hover:scale-[1.01]">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Verify Your Email</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <OtpInput otp={otp} setOtp={setOtp} />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          Didn’t get the OTP?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled}
            className={`ml-1 font-semibold ${
              resendDisabled
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:underline"
            }`}
          >
            {resendDisabled ? `Resend in ${timer}s` : "Resend"}
          </button>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-gray-500 hover:text-blue-600 transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
