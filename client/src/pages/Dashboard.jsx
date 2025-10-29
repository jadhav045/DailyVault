// src/pages/Dashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, LogOut, ArrowRight } from "lucide-react";
import api from "../api/axios";
import { toast } from "react-toastify";
import { handleApiError } from "../utils/handleApiError";
import { getCurrentUser } from "../utils/auth";
import { decryptData } from "../utils/crypto";
import DashboardStats from "./DashboardStats";
import useCategories from "../hooks/useAlllCategory";
import usePaginatedTasks from "../hooks/useAllTasks";

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  const user = getCurrentUser();
  const identity = user?.id ?? null;

  // 🔹 Filters and hook-based data
  const [filters, setFilters] = useState({});
  const { tasks, page, totalPages, setPage, loading } = usePaginatedTasks(
    identity,
    filters
  );
  const { categories } = useCategories(identity);

  // 🔹 Local state for stats and recent tasks
  const [stats, setStats] = useState({ total: 0, completed: 0, categories: 0 });
  const [recent, setRecent] = useState([]);

  // 🔹 Fetch dashboard data
  useEffect(() => {
    if (!identity) return;
    fetchDashboard();

    const interval = setInterval(() => fetchDashboard(), 30000);
    return () => clearInterval(interval);
  }, [identity]);

  const fetchDashboard = async () => {
    try {
      const params =
        identity && identity.includes && identity.includes("-")
          ? { user_uuid: identity }
          : { user_id: identity };

      const [tasksRes, catsRes] = await Promise.all([
        api.get("/tasks", { params }),
        api.get("/categories", { params }),
      ]);

      const tasksData = tasksRes.data.tasks || [];
      const catsData = catsRes.data.categories || [];

      const completed = tasksData.filter(
        (t) => t.status === "Completed"
      ).length;
      const recentRaw = tasksData.slice(0, 5);

      const recentDecrypted = await Promise.all(
        recentRaw.map(async (t) => {
          try {
            const title =
              t.title_encrypted && identity
                ? await decryptData(identity, t.title_encrypted)
                : "";
            return {
              task_id: t.task_id,
              title,
              status: t.status,
              due_date: t.due_date,
            };
          } catch {
            return {
              task_id: t.task_id,
              title: "[unable to decrypt]",
              status: t.status,
              due_date: t.due_date,
            };
          }
        })
      );

      setStats({
        total: tasksData.length,
        completed,
        categories: catsData.length,
      });
      setRecent(recentDecrypted);
    } catch (err) {
      handleApiError(err, "Failed to load dashboard");
    }
  };

  // 🔹 Logout Handler
  const handleLogout = async () => {
    try {
      if (!token) {
        toast.error("No active session found!");
        navigate("/");
        return;
      }

      const res = await api.post(
        "/auth/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "Logout successful!");
    } catch (error) {
      handleApiError(error, "Failed to logout");
    } finally {
      localStorage.removeItem("authToken");
      navigate("/");
    }
  };

  // 🔹 Computed values
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // 🔹 Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Background Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <header className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="text-purple-500" size={24} />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                  Welcome back!
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                {user?.email || "email not found"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/app/tasks")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-medium text-sm shadow-lg"
              >
                Go to Tasks
                <ArrowRight size={16} />
              </button>
              <button
                onClick={handleLogout}
                className="border-2 border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-medium text-sm"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <DashboardStats
          loading={loading}
          stats={stats}
          recent={recent}
          completionRate={completionRate}
          navigate={navigate}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/app/tasks")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-6 rounded-3xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-lg font-bold mb-1">Manage Tasks</h3>
                <p className="text-sm text-purple-100">
                  View and organize all your tasks
                </p>
              </div>
              <ArrowRight size={24} />
            </div>
          </button>

          <button
            onClick={() => navigate("/app/diary")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-6 rounded-3xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-lg font-bold mb-1">Open Diary</h3>
                <p className="text-sm text-indigo-100">
                  Write your thoughts and reflections
                </p>
              </div>
              <ArrowRight size={24} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
