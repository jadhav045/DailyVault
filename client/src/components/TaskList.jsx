import React, { useState } from "react";
import usePaginatedTasks from "../hooks/usePaginatedTasks";
import TaskFilterPanel from "./TaskFilterPanel";

export default function TaskList({ userSecret }) {
  const [filters, setFilters] = useState({});
  const { tasks, page, totalPages, setPage, loading } = usePaginatedTasks(
    userSecret,
    filters
  );

  return (
    <div>
      <h2>My Tasks</h2>
      <TaskFilterPanel onFilterChange={setFilters} />

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks found</p>
      ) : (
        <ul>
          {tasks.map((t) => (
            <li key={t.task_id}>
              <strong>{t.title}</strong> — {t.description} ({t.status})
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      <div style={{ marginTop: "10px" }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        <span style={{ margin: "0 10px" }}>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
