import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import parseJwt from "../api/parseJWT";
import api from "../api/axios";
import { toast } from "react-toastify";
import { handleApiError } from "../utils/handleApiError";
import { getCurrentUser } from "../utils/auth";

const Dashboard = () => {
    const navigate = useNavigate();

    // ✅ Read token and decode user info
    const token = localStorage.getItem("authToken");
    const user = getCurrentUser();

    // Decode token as a fallback to extract user id.
    // Many JWTs use fields like: sub, id, _id, userId
    const decoded = token ? parseJwt(token) : null;
    const userId =
        user?.id ||
        decoded?.id ||
        decoded?.sub ||
        decoded?._id ||
        decoded?.userId ||
        "Id not found";

    if (!token) {
        console.log("TOKEN NOT FOUND");
    } else {
        console.log("Token:", token, "decoded:", decoded);
    }

    const handleLogout = async () => {
        try {
            if (!token) {
                toast.error("No active session found!");
                navigate("/");
                return;
            }

            // ✅ Call backend logout API
            const res = await api.post(
                "/auth/logout",
                {}, // no body needed
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.success(res.data.message || "Logout successful!");
        } catch (error) {
            handleApiError(error, "Failed to logout");
        } finally {
            // ✅ Always clear token & redirect
            localStorage.removeItem("authToken");
            navigate("/");
        }
    };




    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <p className="text-sm text-gray-600">
                        Logged in as {user?.email || "email not found"} (id: {userId})
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                >
                    Logout
                </button>
            </div>



        </div>

    );
};

export default Dashboard;
