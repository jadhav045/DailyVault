import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "../api/axios";

export default function CategoryList() {
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      if (res.data.success) setCategories(res.data.categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        🗂 Your Categories
      </h3>

      {categories.length === 0 ? (
        <p className="text-gray-500">No categories yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div
              key={c.category_id}
              className="p-3 rounded-lg shadow-sm border flex items-center justify-between"
              style={{ backgroundColor: c.color_code }}
            >
              <span className="font-medium text-gray-800">
                {c.category_name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
