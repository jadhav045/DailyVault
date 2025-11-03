import React, { useState } from "react";

export default function CategoryForm({ onAdd }) {
  const [newCategory, setNewCategory] = useState("");
  const [newColor, setNewColor] = useState("#6366F1");

  const handleSubmit = () => {
    onAdd(newCategory, newColor);
    setNewCategory("");
    setNewColor("#6366F1");
  };

  return (
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
        onClick={handleSubmit}
        className="bg-indigo-500 text-white px-4 rounded-lg hover:bg-indigo-600"
      >
        Add
      </button>
    </div>
  );
}
