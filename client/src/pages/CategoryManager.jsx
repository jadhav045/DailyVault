import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/api";
import {
  setCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../store/categorySlice";

export default function CategoryManager() {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.categories.list);
  const [newCategory, setNewCategory] = useState("");
  const [newColor, setNewColor] = useState("#6366F1"); // Default indigo
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("#6366F1");
  const [selected, setSelected] = useState([]);

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

  // Create new category
  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await api.post("/categories", {
        category_name: newCategory,
        color_code: newColor,
      });
      dispatch(addCategory(res.data.category || res.data));
      setNewCategory("");
      setNewColor("#6366F1");
    } catch (err) {
      console.error("❌ Failed to add category:", err);
    }
  };

  // Update category
  const handleUpdate = async (id) => {
    try {
      const res = await api.put(`/categories/${id}`, {
        category_name: editingName,
        color_code: editingColor,
      });
      dispatch(updateCategory(res.data.category || res.data));
      setEditingId(null);
      setEditingName("");
    } catch (err) {
      console.error("❌ Failed to update category:", err);
    }
  };

  // Delete single category
  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      dispatch(deleteCategory(id));
    } catch (err) {
      console.error("❌ Failed to delete category:", err);
    }
  };

  // Delete multiple categories
  const handleDeleteMultiple = async () => {
    if (selected.length === 0) return;
    try {
      await api.delete("/categories", { data: { ids: selected } });
      selected.forEach((id) => dispatch(deleteCategory(id)));
      setSelected([]);
    } catch (err) {
      console.error("❌ Failed to delete multiple:", err);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Category Manager 🗂️
        </h2>

        {/* Add new category */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-12 h-10 border rounded cursor-pointer"
          />
          <button
            onClick={handleAdd}
            className="bg-indigo-500 text-white px-4 rounded-lg hover:bg-indigo-600"
          >
            Add
          </button>
        </div>

        {/* Delete multiple button */}
        {selected.length > 0 && (
          <button
            onClick={handleDeleteMultiple}
            className="mb-3 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
          >
            Delete {selected.length} Selected
          </button>
        )}

        {/* Category list */}
        <ul className="divide-y divide-gray-200">
          {categories.map((cat) => (
            <li
              key={cat.category_id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(cat.category_id)}
                  onChange={() => toggleSelect(cat.category_id)}
                />

                {/* Color Swatch */}
                <span
                  className="w-5 h-5 rounded-full border"
                  style={{ backgroundColor: cat.color_code }}
                ></span>

                {editingId === cat.category_id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="border p-1 rounded w-32"
                    />
                    <input
                      type="color"
                      value={editingColor}
                      onChange={(e) => setEditingColor(e.target.value)}
                      className="w-8 h-8 rounded"
                    />
                  </div>
                ) : (
                  <span>{cat.category_name}</span>
                )}
              </div>

              <div className="flex gap-2">
                {editingId === cat.category_id ? (
                  <button
                    onClick={() => handleUpdate(cat.category_id)}
                    className="text-green-600 font-medium"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(cat.category_id);
                      setEditingName(cat.category_name);
                      setEditingColor(cat.color_code || "#6366F1");
                    }}
                    className="text-blue-600 font-medium"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(cat.category_id)}
                  className="text-red-500 font-medium"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
