// src/components/TaskFilterPanel.js
import React, { useState } from "react";

export default function TaskFilterPanel({ onFilterChange }) {
  const [localFilters, setLocalFilters] = useState({
    status: "",
    category: "",
    priority: "",
    sort: "created_at",
  });

  const handleChange = (e) => {
    const newFilters = { ...localFilters, [e.target.name]: e.target.value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        marginBottom: "10px",
      }}
    >
      <select name="status" value={localFilters.status} onChange={handleChange}>
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="in-progress">In Progress</option>
      </select>

      <select
        name="priority"
        value={localFilters.priority}
        onChange={handleChange}
      >
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <select name="sort" value={localFilters.sort} onChange={handleChange}>
        <option value="created_at">Newest</option>
        <option value="due_date">Due Date</option>
      </select>
    </div>
  );
}
