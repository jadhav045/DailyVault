import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { handleApiError } from "../utils/handleApiError";
import Spinner from "../components/Spinner";

export default function ResetPassword() {
    const [otp, setOtp] = useState("");
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    // email passed from the previous page via navigate('/reset-password', { state: { email } })
    const passedEmail = location?.state?.email ?? "";

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/auth/verifyOTP", {
                email: passedEmail,
                otp,
            });
            toast.success(res.data.message);
            setIsOtpVerified(true);
        } catch (error) {
            handleApiError(error, "OTP verification failed");
        }
        setLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            toast.error("Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            const res = await api.put("/auth/updatePassword", {
                email: passedEmail,
                password,
            });
            toast.success(res.data.message);
            navigate("/");
        } catch (error) {
            handleApiError(error, "Password reset failed");
        }
        setLoading(false);
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const email = passedEmail;
            const res = await api.post("/auth/sendOTP", { email });
            toast.success(res.data.message);
        } catch (error) {
            handleApiError(error, "Failed to resend OTP");
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl transition hover:shadow-2xl">
                <h2 className="mb-6 text-center text-3xl font-semibold text-gray-800">Reset Password</h2>
                <p className="mb-8 text-center text-gray-500">
                    {isOtpVerified
                        ? "Enter your new password below"
                        : "Enter the OTP sent to your registered email"}
                </p>

                {!isOtpVerified ? (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">OTP</label>
                            <input
                                type="text"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white transition hover:bg-indigo-700"
                        >
                            Verify OTP
                        </button>

                        <button
                            type="button"
                            onClick={handleSendOTP}
                            className="w-full rounded-lg border border-indigo-500 py-2 font-medium text-indigo-600 transition hover:bg-indigo-50"
                        >
                            Resend OTP
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">New Password</label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white transition hover:bg-indigo-700"
                        >
                            Reset Password
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
            {loading && <Spinner />}
        </div>
    );
}
