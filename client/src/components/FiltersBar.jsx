import React from "react";

const FiltersBar = ({ filters, categories, onChange }) => {
  return (
    <div className="flex gap-3 mb-4 flex-wrap">
      <select
        name="category_id"
        value={filters.category_id}
        onChange={onChange}
        className="border px-3 py-2 rounded"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.category_id} value={cat.category_id}>
            {cat.category_name}
          </option>
        ))}
      </select>

      <select
        name="priority"
        value={filters.priority}
        onChange={onChange}
        className="border px-3 py-2 rounded"
      >
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>

      <select
        name="status"
        value={filters.status}
        onChange={onChange}
        className="border px-3 py-2 rounded"
      >
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
};

export default FiltersBar;
