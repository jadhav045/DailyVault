import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setLoading,
  updateSubtask,
  addSubtask,
  setSubtasks,
  deleteSubtask,
} from "../store/tasksSlice.js";
import {
  getTasks,
  createTask,
  updateTask as updateAPI,
  deleteTask as deleteAPI,
} from "../api/tasksAPI.js";
import {
  getSubtasks,
  createSubtask,
  updateSubtask as updateSubtaskAPI,
  deleteSubtask as deleteSubtaskAPI,
} from "../api/subtasksAPI.js";

import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";

const TasksPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.tasks);
  const { list: categories } = useSelector((s) => s.categories);

  const token = localStorage.getItem("token");

  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null); // ✅ for edit mode

  // Filters
  const [filters, setFilters] = useState({
    category_id: "",
    priority: "",
    status: "",
  });

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const fetchTasks = async () => {
    dispatch(setLoading(true));
    const data = await getTasks(token);
    dispatch(setTasks(data));
    dispatch(setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // CREATE
  const handleCreateTask = async (taskData) => {
    const newTask = await createTask(token, taskData);
    dispatch(addTask(newTask.task));
    setShowForm(false);
  };

  // UPDATE STATUS (toggle complete/pending)
  const handleUpdate = async (task) => {
    const nextStatus =
      task.status?.toLowerCase() === "completed" ? "pending" : "completed";
    const updated = { ...task, status: nextStatus };

    try {
      const response = await updateAPI(token, task.task_id, updated);
      const updatedTask = response?.data ?? updated;
      dispatch(updateTask(updatedTask));
    } catch (error) {
      console.error("[handleUpdate] failed:", error);
    }
  };

  // ✅ UPDATE (edit form)
  const handleUpdateTask = async (formData) => {
    try {
      const response = await updateAPI(token, formData.task_id, formData);
      const updatedTask = response?.data ?? formData;
      dispatch(updateTask(updatedTask));
      setEditTask(null);
      setShowForm(false);
    } catch (error) {
      console.error("[handleUpdateTask] failed:", error);
    }
  };

  const handleDelete = async (id) => {
    await deleteAPI(token, id);
    dispatch(deleteTask(id));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  // FILTERED + PAGINATED
  const filteredTasks = useMemo(() => {
    return list.filter((task) => {
      const matchCategory =
        !filters.category_id || task.category_id == filters.category_id;
      const matchPriority =
        !filters.priority || task.priority === filters.priority;
      const matchStatus = !filters.status || task.status === filters.status;
      return matchCategory && matchPriority && matchStatus;
    });
  }, [list, filters]);

  const totalPages = Math.ceil(filteredTasks.length / pageSize);
  const paginatedTasks = filteredTasks.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // ----------- SUBTASKS -----------
  const handleLoadSubtasks = async (task_id) => {
    const subtasks = await getSubtasks(token, task_id);
    dispatch(setSubtasks({ task_id, subtasks }));
  };

  const handleAddSubtask = async (task_id, title) => {
    const newSub = await createSubtask(token, task_id, { title });
    dispatch(addSubtask({ task_id, subtask: newSub }));
  };

  const handleSubtaskToggle = async (task_id, subtask_id, is_completed) => {
    const updated = await updateSubtaskAPI(token, subtask_id, {
      is_completed: !is_completed,
    });
    dispatch(updateSubtask({ task_id, subtask: updated }));
  };

  const handleSubtaskDelete = async (task_id, subtask_id) => {
    await deleteSubtaskAPI(token, subtask_id);
    dispatch(deleteSubtask({ task_id, subtask_id }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">🗂 Task Manager</h2>
        <button
          onClick={() => {
            setEditTask(null); // ✅ ensure it's not in edit mode
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          + Add Task
        </button>
      </div>

      {/* ✅ Unified Form for Create + Edit */}
      {showForm && (
        <TaskForm
          onSubmit={editTask ? handleUpdateTask : handleCreateTask}
          onClose={() => {
            setShowForm(false);
            setEditTask(null);
          }}
          initialData={editTask} // ✅ prefill when editing
        />
      )}

         {/* {showForm && (
              <TaskForm
                initialData={editTask}
                onSubmit={editTask ? handleEditTask : handleCreateTask}
                onClose={() => {
                  setShowForm(false);
                  setEditTask(null);
                }}
              />
            )} */}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          name="category_id"
          value={filters.category_id}
          onChange={handleFilterChange}
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
          onChange={handleFilterChange}
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
          onChange={handleFilterChange}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Tasks */}
      <TaskList
        tasks={paginatedTasks}
        loading={loading}
        handleUpdate={handleUpdate}
        handleDelete={handleDelete}
        handleSubtaskToggle={handleSubtaskToggle}
        handleSubtaskDelete={handleSubtaskDelete}
        handleAddSubtask={handleAddSubtask}
        handleUpdateTask={handleUpdateTask}
        onEditTask={(task) => {
          setEditTask(task);
          setShowForm(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className={`border px-3 py-1 rounded ${
              page <= 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Prev
          </button>

          <span>
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={`border px-3 py-1 rounded ${
              page >= totalPages ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
