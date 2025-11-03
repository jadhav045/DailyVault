import React, { useEffect, useState } from "react";
import CategoryManager from "./CategoryManager"; // For categories CRUD
import TasksPage from "./TasksPage"; // Placeholder for your tasks component
import DiaryPage from "./DiaryPage"; // Placeholder for your diary component
import api from "../api/api";
import { setCategories } from "../store/categorySlice";
import { useDispatch } from "react-redux";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("tasks");

  const renderContent = () => {
    switch (activeTab) {
      case "tasks":
        return <TasksPage />;
      case "diary":
        return <DiaryPage />;
      case "categories":
        return <CategoryManager />;
      default:
        return <TasksPage />;
    }
  };
  const dispatch = useDispatch();

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      const list = Array.isArray(res.data) ? res.data : res.data.categories;
      if (Array.isArray(list)) dispatch(setCategories(list));
    } catch (err) {
      console.error("❌ Failed to fetch categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-700 text-white flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold p-4 border-b border-indigo-500">
            Dashboard
          </h2>
          <nav className="mt-4">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`w-full text-left px-6 py-3 hover:bg-indigo-600 transition ${
                activeTab === "tasks" ? "bg-indigo-600" : ""
              }`}
            >
              🧩 Tasks
            </button>
            <button
              onClick={() => setActiveTab("diary")}
              className={`w-full text-left px-6 py-3 hover:bg-indigo-600 transition ${
                activeTab === "diary" ? "bg-indigo-600" : ""
              }`}
            >
              📖 Diary
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`w-full text-left px-6 py-3 hover:bg-indigo-600 transition ${
                activeTab === "categories" ? "bg-indigo-600" : ""
              }`}
            >
              🗂️ Categories
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-indigo-500">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 capitalize">
            {activeTab}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-600 text-sm">Welcome 👋</span>
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
              U
            </div>
          </div>
        </header>

        <section>{renderContent()}</section>
      </main>
    </div>
  );
}
