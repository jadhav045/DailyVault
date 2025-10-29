import React, { useState } from "react";
import axios from "axios";
import api from "../api/axios";

export default function CategoryForm({ onCategoryAdded }) {
  const [form, setForm] = useState({
    category_name: "",
    color_code: "#ffffff",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/categories", form);

      if (res.data.success) {
        alert("✅ Category created successfully!");
        if (onCategoryAdded) onCategoryAdded(res.data.category);
        setForm({ category_name: "", color_code: "#ffffff" });
      } else {
        alert("❌ Failed to create category");
      }
    } catch (err) {
      console.error("Error creating category:", err);
      alert("Server error while creating category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-5 rounded-xl shadow-md border border-gray-100 w-full max-w-md"
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        ➕ Add New Category
      </h2>

      {/* Category Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category Name
        </label>
        <input
          type="text"
          name="category_name"
          value={form.category_name}
          onChange={handleChange}
          required
          placeholder="e.g., Work, Personal, College"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
        />
      </div>

      {/* Color Picker */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            name="color_code"
            value={form.color_code}
            onChange={handleChange}
            className="w-10 h-10 border rounded cursor-pointer"
          />
          <span className="text-sm text-gray-600">{form.color_code}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded-lg text-white font-medium ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        } transition`}
      >
        {loading ? "Adding..." : "Add Category"}
      </button>
    </form>
  );
}
