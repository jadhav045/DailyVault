import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
// import {jwtDecode} from "jwt-decode"; // npm install jwt-decode
import {jwtDecode} from "jwt-decode";

export default function Dashboard() {
  const [decodedToken, setDecodedToken] = useState(null);
  const [toastShown, setToastShown] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      if (!toastShown) {
        showToast("You must log in first!", "error");
        setToastShown(true);
      }
      navigate("/login");
      return;
    }

    try {

      const decoded = jwtDecode(token);

      setDecodedToken(decoded);

      if (!toastShown) {
        showToast("Welcome to your dashboard!", "success");
        setToastShown(true);
      }
    } catch (err) {
      if (!toastShown) {
        showToast("Invalid token. Please log in again.", "error");
        setToastShown(true);
      }
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate, showToast, toastShown]);

  if (!decodedToken)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-600 text-lg">Loading token data...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Token Details 🔐
        </h2>

        <div className="text-left bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-700">
          {Object.entries(decodedToken).map(([key, value]) => (
            <div key={key} className="mb-2">
              <span className="font-semibold">{key}: </span>
              <span>{String(value)}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            showToast("Logged out successfully!", "info");
            navigate("/login");
          }}
          className="mt-6 w-full py-3 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-all"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
