import React, { useEffect, useState } from "react";

export default function TaskForm({ show, onClose, onSave, initial = {}, categories = [] }) {
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium", due_date: "", category_id: "" });

  useEffect(() => {
    if (initial && Object.keys(initial).length > 0) {
      setForm({
        title: initial.title || "",
        description: initial.description || "",
        priority: initial.priority || "Medium",
        due_date: initial.due_date ? initial.due_date.slice(0, 16).replace(" ", "T") : "",
        category_id: initial.category_id || "",
      });
    } else {
      setForm({ title: "", description: "", priority: "Medium", due_date: "", category_id: "" });
    }
  }, [initial, show]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-4">
        <h3 className="text-lg font-semibold mb-3">{initial.task_id ? "Edit Task" : "New Task"}</h3>
        <div className="space-y-3">
          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full border rounded px-3 py-2" />
          <textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="Description" className="w-full border rounded px-3 py-2" />
          <div className="grid grid-cols-2 gap-2">
            <select name="priority" value={form.priority} onChange={handleChange} className="border rounded px-3 py-2">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <select name="category_id" value={form.category_id} onChange={handleChange} className="border rounded px-3 py-2">
              <option value="">No category</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
          </div>
          <input name="due_date" type="datetime-local" value={form.due_date} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="border rounded px-4 py-2">Cancel</button>
          <button onClick={() => onSave(form)} className="bg-purple-600 text-white rounded px-4 py-2">{initial.task_id ? "Update" : "Create"}</button>
        </div>
      </div>
    </div>
  );
}
