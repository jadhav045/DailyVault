// src/pages/Tasks.js
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TaskFilterPanel from "../components/TaskFilterPanel";
import { getCurrentUser } from "../utils/auth";
// import { fetchTasks } from "../store/tasksSlice";
// import { fetchCategories } from "../store/categoriesSlice";

export default function Tasks() {
  const dispatch = useDispatch();

  // 🔹 Redux store selectors
  const {
    list: tasks,
    loading,
    totalPages,
    page,
  } = useSelector((state) => state.tasks);

  const { list: categories } = useSelector((state) => state.categories);

  const [filters, setFilters] = useState({});
  const current = getCurrentUser();
  const identity = current?.id ?? null;

  // 🔹 Fetch categories once
  useEffect(() => {
    
    if (identity) {
      dispatch(fetchCategories(identity));
    }

  }, [dispatch, identity]);

  // 🔹 Fetch tasks whenever filters or page change
  useEffect(() => {
    if (identity) {
      dispatch(fetchTasks({ identity, filters, page }));
    }
  }, [dispatch, identity, filters, page]);

  return (
    <div style={{ maxWidth: "600px", margin: "auto" }}>
      <h2>📋 My Tasks</h2>

      {/* 🔹 Pass fetched categories to the filter panel */}
      <TaskFilterPanel onFilterChange={setFilters} categories={categories} />

      {/* 🔹 Task List */}
      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks found</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {tasks.map((t) => (
            <li
              key={t.task_id}
              style={{
                background: "#f9f9f9",
                marginBottom: "8px",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              <strong>{t.title}</strong> — {t.status} <br />
              <small>{t.priority_name}</small>
            </li>
          ))}
        </ul>
      )}

      {/* 🔹 Pagination */}
      <div
        style={{
          marginTop: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <button
          onClick={() => dispatch({ type: "tasks/prevPage" })}
          disabled={page === 1}
        >
          ◀ Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => dispatch({ type: "tasks/nextPage" })}
          disabled={page === totalPages}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
