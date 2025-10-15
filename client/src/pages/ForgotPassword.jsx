import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { handleApiError } from "../utils/handleApiError";
import Spinner from "../components/Spinner";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/auth/sendOTP", { email });
            toast.success(res.data.message);
            navigate("/reset-password", { state: { email } });
        } catch (error) {
            handleApiError(error, "Failed to send OTP");
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl transition hover:shadow-2xl">
                <h2 className="mb-6 text-center text-3xl font-semibold text-gray-800">Forgot Password</h2>
                <p className="mb-8 text-center text-gray-500">
                    Enter your registered email to receive a One-Time Password (OTP)
                </p>

                <form onSubmit={handleSendOTP} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white transition hover:bg-indigo-700"
                    >
                        Send OTP
                    </button>
                </form>

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
