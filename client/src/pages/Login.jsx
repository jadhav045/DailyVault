import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { handleApiError } from "../utils/handleApiError";
import Spinner from "../components/Spinner";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/auth/login", { email, password });
            const token = res.data.token;
            localStorage.setItem("authToken", token);
            toast.success(res.data.message);
            navigate("/dashboard");
        } catch (error) {
            handleApiError(error, "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl transition hover:shadow-2xl">
                <h2 className="mb-6 text-center text-3xl font-semibold text-gray-800">Welcome Back</h2>
                <p className="mb-8 text-center text-gray-500">Login to access your account</p>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white transition hover:bg-indigo-700"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="mt-6">
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                        <button
                            type="button"
                            onClick={() => navigate("/forgot")}
                            className="text-sm text-gray-600 hover:text-indigo-600 hover:underline"
                        >
                            Forgot password?
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/register")}
                            className="w-full sm:w-auto rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                        >
                            Create account
                        </button>
                    </div>
                </div>
            </div>
            {loading && <Spinner />}
        </div>
    );
}
