import React, { useState } from "react";

export default function CategoryEditModal({ category, onClose, onSave }) {
  const [name, setName] = useState(category.name);

  const handleSave = () => {
    if (name.trim()) {
      onSave(category.category_id, name);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Edit Category</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border w-full px-3 py-2 rounded-lg mb-4 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
