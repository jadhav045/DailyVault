import React from "react";

export default function CategoryList({
  categories,
  selected,
  editingId,
  editingName,
  editingColor,
  toggleSelect,
  setEditingId,
  setEditingName,
  setEditingColor,
  handleUpdate,
  handleDelete,
}) {
  return (
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
  );
}
