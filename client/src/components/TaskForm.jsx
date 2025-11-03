import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const TaskForm = ({ onSubmit, initialData = null }) => {
  const { list: categories } = useSelector((s) => s.categories);
  const [formData, setFormData] = useState({
    category_id: "",
    title: "",
    description: "",
    due_date: "",
    status: "pending",
    priority: "medium",
  });

  // Load existing task data when editing
  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-white p-4 rounded-lg shadow"
    >
      <h3 className="text-lg font-semibold mb-2">
        {initialData ? "Update Task" : "Add New Task"}
      </h3>

      <select
        name="category_id"
        value={formData.category_id}
        onChange={handleChange}
        className="border w-full px-3 py-2 rounded"
        required
      >
        <option value="">Select Category</option>
        {categories.map((cat) => (
          <option key={cat.category_id} value={cat.category_id}>
            {cat.category_name}
          </option>
        ))}
      </select>

      <input
        type="text"
        name="title"
        placeholder="Title"
        value={formData.title}
        onChange={handleChange}
        className="border w-full px-3 py-2 rounded"
        required
      />

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
        className="border w-full px-3 py-2 rounded"
      ></textarea>

      <input
        type="date"
        name="due_date"
        value={formData.due_date}
        onChange={handleChange}
        className="border w-full px-3 py-2 rounded"
      />

      <select
        name="priority"
        value={formData.priority}
        onChange={handleChange}
        className="border w-full px-3 py-2 rounded"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {initialData ? "Update" : "Save"}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
