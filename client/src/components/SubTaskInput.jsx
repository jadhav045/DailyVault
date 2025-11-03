import React, { useState } from "react";
import { PlusCircle } from "lucide-react";

const SubtaskInput = ({ onAdd }) => {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    try {
      await onAdd(title.trim());
      setTitle("");
    } catch (error) {
      console.error("Failed to add subtask:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
      <input
        type="text"
        placeholder="Add subtask..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <button
        type="submit"
        disabled={loading}
        className={`text-blue-600 hover:text-blue-700 transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="Add Subtask"
      >
        <PlusCircle size={18} />
      </button>
    </form>
  );
};

export default SubtaskInput;
