import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { handleApiError } from "../utils/handleApiError";

export default function Register() {
    const [data, setData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const navigate = useNavigate();

    // flow: 'enter' -> 'otpSent' -> 'password'
    const [flow, setFlow] = useState("enter");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [resending, setResending] = useState(false);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleOtpInput = (e) => setOtp(e.target.value);

    // utility to generate a temporary password when we need to create the user for OTP
    const genTempPassword = () => Math.random().toString(36).slice(2, 10);

    // Step 1: verify email (send OTP). If user doesn't exist, create temporary user via register endpoint (server sends OTP on register as configured).
    const handleVerifyEmail = async (e) => {
        e?.preventDefault?.();
        const { name, email } = data;
        if (!name || !email) {
            toast.error("Please provide both name and email");
            return;
        }

        setLoading(true);
        try {
            // try sending OTP to an existing user
            await api.post("/auth/sendOTP", { email });
            toast.success("OTP sent to your email");
            setFlow("otpSent");
            return;
        } catch (err) {
            // if user not found, fallback to creating a temporary user (register) which sends OTP on server
            const status = err?.response?.status;
            if (status === 404) {
                try {
                    const tempPassword = genTempPassword();
                    await api.post("/auth/register", { name, email, password: tempPassword });
                    toast.success("Account created (temporary). OTP sent to your email");
                    setFlow("otpSent");
                    return;
                } catch (regErr) {
                    handleApiError(regErr, "Failed to create temporary account");
                    return;
                }
            }
            handleApiError(err, "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP (calls sendOTP; if user wasn't created and server still 404, we suggest pressing Verify Email again)
    const handleResendOtp = async () => {
        if (!data.email) {
            toast.error("Email missing");
            return;
        }
        setResending(true);
        try {
            await api.post("/auth/sendOTP", { email: data.email });
            toast.success("OTP resent");
        } catch (err) {
            handleApiError(err, "Resend OTP failed");
        } finally {
            setResending(false);
        }
    };

    // Step 2: verify OTP
    const handleVerifyOtp = async () => {
        if (!otp) {
            toast.error("Please enter the OTP");
            return;
        }
        setVerifyingOtp(true);
        try {
            await api.post("/auth/verifyOTP", { email: data.email, otp });
            toast.success("OTP verified. Please set your password.");
            setFlow("password");
        } catch (err) {
            handleApiError(err, "OTP verification failed");
        } finally {
            setVerifyingOtp(false);
        }
    };

    // Step 3: set final password (updates the temp password set earlier if any)
    const handleSetPassword = async (e) => {
        e.preventDefault();
        const { password, email } = data;
        if (!password) {
            toast.error("Please enter a password");
            return;
        }
        setLoading(true);
        try {
            await api.put("/auth/updatePassword", { email, password });
            toast.success("Password set. Registration complete. Please login.");
            navigate("/login");
        } catch (err) {
            handleApiError(err, "Setting password failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl transition hover:shadow-2xl">
                <h2 className="mb-6 text-center text-3xl font-semibold text-gray-800">Create Account</h2>
                <p className="mb-8 text-center text-gray-500">
                    We'll verify your email before you set a password
                </p>

                {/* Step: enter name+email */}
                {flow === "enter" && (
                    <form onSubmit={handleVerifyEmail} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                value={data.name}
                                onChange={handleInput}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={data.email}
                                onChange={handleInput}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {loading ? "Sending..." : "Verify Email"}
                        </button>
                    </form>
                )}

                {/* Step: OTP sent -> verify OTP */}
                {flow === "otpSent" && (
                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={data.email}
                                readOnly
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-600"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Enter OTP</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="otp"
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={handleOtpInput}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                                <button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={verifyingOtp}
                                    className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-60"
                                >
                                    {verifyingOtp ? "Verifying..." : "Verify"}
                                </button>
                            </div>
                            <div className="mt-2 text-sm">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resending}
                                    className="text-indigo-600 hover:underline disabled:opacity-60"
                                >
                                    {resending ? "Resending..." : "Resend OTP"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setFlow("enter"); }}
                                    className="ml-4 text-sm text-gray-600 hover:underline"
                                >
                                    Edit details
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step: OTP verified -> set password */}
                {flow === "password" && (
                    <form onSubmit={handleSetPassword} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={data.email}
                                readOnly
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-600"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Set Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Create a password"
                                value={data.password}
                                onChange={handleInput}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {loading ? "Saving..." : "Complete Registration"}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="font-medium text-indigo-600 hover:underline"
                        >
                            Login here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
