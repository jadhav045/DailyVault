import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/api";
import {
  addCategory,
  updateCategory,
  deleteCategory,
} from "../store/categorySlice";
import CategoryForm from "../components/CategoryForm.jsx";
import CategoryList from "../components/CategoryList.jsx";

export default function CategoryManager() {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.categories.list);
  const [selected, setSelected] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("#6366F1");

  // Create new category
  const handleAdd = async (name, color) => {
    if (!name.trim()) return;
    try {
      const res = await api.post("/categories", {
        category_name: name,
        color_code: color,
      });
      dispatch(addCategory(res.data.category || res.data));
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

  // Delete single
  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      dispatch(deleteCategory(id));
    } catch (err) {
      console.error("❌ Failed to delete category:", err);
    }
  };

  // Delete multiple
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

        <CategoryForm onAdd={handleAdd} />

        {selected.length > 0 && (
          <button
            onClick={handleDeleteMultiple}
            className="mb-3 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
          >
            Delete {selected.length} Selected
          </button>
        )}

        <CategoryList
          categories={categories}
          selected={selected}
          editingId={editingId}
          editingName={editingName}
          editingColor={editingColor}
          toggleSelect={toggleSelect}
          setEditingId={setEditingId}
          setEditingName={setEditingName}
          setEditingColor={setEditingColor}
          handleUpdate={handleUpdate}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
}
