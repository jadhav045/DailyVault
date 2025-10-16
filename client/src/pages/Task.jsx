import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
} from "lucide-react";
import api from "../api/axios";
import { getCurrentUser } from "../utils/auth";
import { encryptData, decryptData } from "../utils/crypto";
import { toast } from "react-toastify";

function mysqlToDatetimeLocal(mysql) {
  if (!mysql) return "";
  return mysql.slice(0, 16).replace(" ", "T");
}

function datetimeLocalToMySQL(value) {
  if (!value) return null;
  return value.includes(":") && value.includes("T")
    ? value.replace("T", " ") + ":00"
    : value.replace("T", " ");
}

// Memoized TaskCard for performance
const TaskCard = React.memo(function TaskCard({
  task,
  category,
  priorityStyle,
  isExpanded,
  onToggleStatus,
  onExpand,
  onEdit,
  onDelete,
  subtasks,
  onToggleSubtask,
  onDeleteSubtask,
  subtaskInput,
  onSubtaskInputChange,
  onCreateSubtask,
}) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow border border-white/50 hover:shadow-xl transition-all">
      <div className="flex items-start gap-3">
        <button onClick={() => onToggleStatus(task)} className="mt-1">
          {task.status === "Completed" ? (
            <CheckCircle2 className="text-green-500" size={20} />
          ) : (
            <Circle className="text-gray-400" size={20} />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className={`font-semibold text-gray-800 ${
                task.status === "Completed" ? "line-through text-gray-500" : ""
              }`}
            >
              {task.title}
            </h3>
            <span
              className={`${priorityStyle.color} text-xs px-2 py-0.5 rounded-lg font-medium`}
            >
              {task.priority}
            </span>
            {category && (
              <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-lg">
                <div
                  style={{
                    background: category.color,
                    width: 12,
                    height: 12,
                  }}
                  className="rounded-full"
                />
                <span>{category.name}</span>
              </div>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          )}
          {task.due_date && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <Calendar size={12} />
              <span>Due: {new Date(task.due_date).toLocaleString()}</span>
            </div>
          )}
          {/* Subtasks */}
          {isExpanded && (
            <div className="mt-3 space-y-2 border-t pt-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                Subtasks
              </p>
              {subtasks.map((s) => (
                <div
                  key={s.subtask_id}
                  className="flex items-center justify-between gap-2 bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={s.status === "Completed"}
                      onChange={() => onToggleSubtask(s)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span
                      className={`text-sm ${
                        s.status === "Completed"
                          ? "line-through text-gray-500"
                          : ""
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteSubtask(s.subtask_id, task.task_id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input
                  value={subtaskInput || ""}
                  onChange={(e) =>
                    onSubtaskInputChange(task.task_id, e.target.value)
                  }
                  placeholder="Add subtask..."
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <button
                  onClick={() => onCreateSubtask(task.task_id)}
                  className="bg-purple-600 text-white px-3 py-2 rounded-xl hover:bg-purple-700 text-sm"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onExpand(task.task_id)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 hover:bg-yellow-100 rounded-lg transition text-yellow-600"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(task.task_id)}
            className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default function TaskPage() {
  const current = getCurrentUser();
  const identity = current?.id ?? "";
  const isUuid =
    identity && typeof identity === "string" && identity.includes("-");

  const [categories, setCategories] = useState([]);
  const [catForm, setCatForm] = useState({
    name: "",
    color: "#6B7280",
    icon: "",
  });
  const [catLoading, setCatLoading] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    due_date: "",
    category_id: "",
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});

  const [subtasksMap, setSubtasksMap] = useState({});
  const [subtaskInputs, setSubtaskInputs] = useState({});

  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const priorityConfig = {
    Low: {
      color: "bg-blue-100 text-blue-700",
      gradient: "from-blue-400 to-blue-600",
    },
    Medium: {
      color: "bg-yellow-100 text-yellow-700",
      gradient: "from-yellow-400 to-orange-500",
    },
    High: {
      color: "bg-red-100 text-red-700",
      gradient: "from-red-400 to-red-600",
    },
  };

  useEffect(() => {
    if (!identity) return;
    loadCategories();
    loadTasks();
  }, [identity]);

  const loadCategories = async () => {
    setCatLoading(true);
    try {
      const params = isUuid ? { user_uuid: identity } : { user_id: identity };
      const res = await api.get("/categories", { params });
      setCategories(res.data.categories || []);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setCatLoading(false);
    }
  };

  const createCategory = async (e) => {
    e?.preventDefault();
    if (!catForm.name) return toast.error("Category name required");
    try {
      const payload = { ...catForm };
      if (isUuid) payload.user_uuid = identity;
      else payload.user_id = identity;
      await api.post("/categories", payload);
      toast.success("Category created");
      setCatForm({ name: "", color: "#6B7280", icon: "" });
      setShowCatModal(false);
      loadCategories();
    } catch (err) {
      toast.error("Create category failed");
    }
  };

  const loadTasks = async () => {
    setLoadingTasks(true);
    try {
      const params = isUuid ? { user_uuid: identity } : { user_id: identity };
      const res = await api.get("/tasks", { params });
      const remote = res.data.tasks || [];
      const decrypted = await Promise.all(
        remote.map(async (t) => {
          let title = t.title_encrypted;
          let description = t.description_encrypted;
          try {
            title = t.title_encrypted
              ? await decryptData(identity, t.title_encrypted)
              : "";
          } catch {
            title = "[decrypt failed]";
          }
          try {
            description = t.description_encrypted
              ? await decryptData(identity, t.description_encrypted)
              : "";
          } catch {
            description = "[decrypt failed]";
          }
          return { ...t, title, description };
        })
      );
      setTasks(decrypted);
      for (const t of decrypted) {
        loadSubtasks(t.task_id);
      }
    } catch (err) {
      toast.error("Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleTaskInput = (e) =>
    setTaskForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const saveTask = async (e) => {
    e?.preventDefault();
    if (!taskForm.title) return toast.error("Task title required");
    if (!identity) return toast.error("Login required");

    try {
      const encTitle = await encryptData(identity, taskForm.title);
      const encDesc = taskForm.description
        ? await encryptData(identity, taskForm.description)
        : null;
      const payload = {
        user_id: identity,
        title_encrypted: encTitle,
        description_encrypted: encDesc,
        priority: taskForm.priority,
        due_date: datetimeLocalToMySQL(taskForm.due_date),
        category_id: taskForm.category_id || null,
      };
      if (identity.includes("-")) {
        payload.user_uuid = identity;
        delete payload.user_id;
      }

      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, payload);
        toast.success("Task updated");
        setEditingTaskId(null);
      } else {
        await api.post("/tasks", payload);
        toast.success("Task created");
      }
      setTaskForm({
        title: "",
        description: "",
        priority: "Medium",
        due_date: "",
        category_id: "",
      });
      setShowTaskModal(false);
      loadTasks();
    } catch (err) {
      toast.error("Save task failed");
    }
  };

  const loadSubtasks = async (taskId) => {
    try {
      const res = await api.get(`/subtasks/task/${taskId}`);
      const remote = res.data.subtasks || [];
      const decrypted = await Promise.all(
        remote.map(async (s) => {
          let title = s.title_encrypted;
          try {
            title = s.title_encrypted
              ? await decryptData(identity, s.title_encrypted)
              : "";
          } catch {
            title = "[decrypt failed]";
          }
          return { ...s, title };
        })
      );
      setSubtasksMap((m) => ({ ...m, [taskId]: decrypted }));
    } catch (err) {
      toast.error("Failed to load subtasks");
    }
  };

  // Memoize handlers so TaskCard doesn't re-render unnecessarily
  const handleToggleStatus = useCallback(async (t) => {
    const newStatus = t.status === "Pending" ? "Completed" : "Pending";
    try {
      await api.patch(`/tasks/${t.task_id}/status`, { status: newStatus });
      toast.success("Status updated");
      setTasks((prev) =>
        prev.map((task) =>
          task.task_id === t.task_id ? { ...task, status: newStatus } : task
        )
      );
    } catch (err) {
      toast.error("Status update failed");
    }
  }, []);

  const handleExpand = useCallback((taskId) => {
    setExpandedTasks((p) => ({ ...p, [taskId]: !p[taskId] }));
  }, []);

  const handleEdit = useCallback((t) => {
    setEditingTaskId(t.task_id);
    setTaskForm({
      title: t.title,
      description: t.description,
      priority: t.priority,
      due_date: t.due_date ? mysqlToDatetimeLocal(t.due_date) : "",
      category_id: t.category_id || "",
    });
    setShowTaskModal(true);
  }, []);

  const handleDelete = useCallback(async (taskId) => {
    if (!window.confirm("Delete task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Task deleted");
      setTasks((p) => p.filter((x) => x.task_id !== taskId));
    } catch (err) {
      toast.error("Delete failed");
    }
  }, []);

  const handleToggleSubtask = useCallback(async (subtask) => {
    const newStatus = subtask.status === "Pending" ? "Completed" : "Pending";
    try {
      await api.patch(`/subtasks/${subtask.subtask_id}/status`, {
        status: newStatus,
      });
      toast.success("Subtask status updated");
      setSubtasksMap((m) => ({
        ...m,
        [subtask.task_id]: m[subtask.task_id].map((s) =>
          s.subtask_id === subtask.subtask_id ? { ...s, status: newStatus } : s
        ),
      }));
    } catch (err) {
      toast.error("Update failed");
    }
  }, []);

  const handleDeleteSubtask = useCallback(async (id, taskId) => {
    if (!window.confirm("Delete subtask?")) return;
    try {
      await api.delete(`/subtasks/${id}`);
      toast.success("Subtask deleted");
      setSubtasksMap((m) => ({
        ...m,
        [taskId]: m[taskId].filter((s) => s.subtask_id !== id),
      }));
    } catch (err) {
      toast.error("Delete failed");
    }
  }, []);

  const handleSubtaskInputChange = useCallback((taskId, value) => {
    setSubtaskInputs((m) => ({ ...m, [taskId]: value }));
  }, []);

  const handleCreateSubtask = useCallback(
    async (taskId) => {
      const text = (subtaskInputs[taskId] || "").trim();
      if (!text) return toast.error("Subtask required");
      try {
        const enc = await encryptData(identity, text);
        const res = await api.post("/subtasks", {
          task_id: taskId,
          title_encrypted: enc,
        });
        toast.success("Subtask added");
        setSubtaskInputs((s) => ({ ...s, [taskId]: "" }));
        // Add new subtask to local state
        const newSubtask = res.data.subtask
          ? { ...res.data.subtask, title: text }
          : {
              subtask_id: Math.random(),
              title: text,
              status: "Pending",
              task_id: taskId,
            };
        setSubtasksMap((m) => ({
          ...m,
          [taskId]: [...(m[taskId] || []), newSubtask],
        }));
      } catch (err) {
        toast.error("Add subtask failed");
      }
    },
    [subtaskInputs, identity]
  );

  const filteredTasks = tasks.filter((t) => {
    const matchesPriority = !filterPriority || t.priority === filterPriority;
    const matchesStatus = !filterStatus || t.status === filterStatus;
    return matchesPriority && matchesStatus;
  });

  const pendingCount = tasks.filter((t) => t.status === "Pending").length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <header className="text-center pt-6 pb-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            Task Manager
          </h1>
          <p className="text-gray-600 text-sm">Organize, Track, Achieve 🎯</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-3 shadow border border-white/50">
            <CheckCircle2 className="text-green-500 mb-1" size={18} />
            <p className="text-xl font-bold text-gray-800">{completedCount}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-3 shadow border border-white/50">
            <Circle className="text-orange-500 mb-1" size={18} />
            <p className="text-xl font-bold text-gray-800">{pendingCount}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-3 shadow border border-white/50">
            <Tag className="text-purple-500 mb-1" size={18} />
            <p className="text-xl font-bold text-gray-800">
              {categories.length}
            </p>
            <p className="text-xs text-gray-500">Categories</p>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow border border-white/50">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-gray-700">Categories</p>
            <button
              onClick={() => setShowCatModal(true)}
              className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-xl hover:from-purple-700 hover:to-pink-700 transition flex items-center gap-1"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.length === 0 ? (
              <p className="text-xs text-gray-500">No categories yet</p>
            ) : (
              categories.map((c) => (
                <div
                  key={c.category_id}
                  className="flex items-center gap-2 px-3 py-1.5 border rounded-xl bg-white/50"
                >
                  <div
                    style={{ background: c.color, width: 20, height: 20 }}
                    className="rounded-full"
                  />
                  <span className="text-xs font-medium">
                    {c.icon} {c.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow border border-white/50 space-y-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full px-4 py-2 rounded-xl border-2 transition flex items-center justify-between text-sm font-medium ${
              showFilters
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Filter size={16} />
              Filters
            </span>
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-gray-200">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">All priorities</option>
                <option value="Low">🔵 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🔴 High</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">All status</option>
                <option value="Pending">⏳ Pending</option>
                <option value="Completed">✅ Completed</option>
              </select>
            </div>
          )}
        </div>

        {/* Tasks */}
        {loadingTasks ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow border border-white/50 p-12 text-center">
            <p className="text-gray-500">
              No tasks yet — create your first task! 🚀
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((t) => {
              const priorityStyle = priorityConfig[t.priority];
              const isExpanded = expandedTasks[t.task_id];
              const subs = subtasksMap[t.task_id] || [];
              const category = categories.find(
                (c) => c.category_id === t.category_id
              );
              return (
                <TaskCard
                  key={t.task_id}
                  task={t}
                  category={category}
                  priorityStyle={priorityStyle}
                  isExpanded={isExpanded}
                  onToggleStatus={handleToggleStatus}
                  onExpand={handleExpand}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  subtasks={subs}
                  onToggleSubtask={handleToggleSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  subtaskInput={subtaskInputs[t.task_id]}
                  onSubtaskInputChange={handleSubtaskInputChange}
                  onCreateSubtask={handleCreateSubtask}
                />
              );
            })}
          </div>
        )}

        {/* Floating Add Button */}
        <button
          onClick={() => {
            setShowTaskModal(true);
            setEditingTaskId(null);
          }}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 z-40"
        >
          <Plus size={24} />
        </button>

        {/* Category Modal */}
        {showCatModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
                <h2 className="text-lg font-bold">New Category</h2>
                <button
                  onClick={() => setShowCatModal(false)}
                  className="hover:bg-white/20 p-1.5 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={createCategory} className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Name
                  </label>
                  <input
                    value={catForm.name}
                    onChange={(e) =>
                      setCatForm({ ...catForm, name: e.target.value })
                    }
                    placeholder="Category name"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                      Color
                    </label>
                    <input
                      type="color"
                      value={catForm.color}
                      onChange={(e) =>
                        setCatForm({ ...catForm, color: e.target.value })
                      }
                      className="w-full h-10 border-2 border-gray-200 rounded-xl cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                      Icon
                    </label>
                    <input
                      value={catForm.icon}
                      onChange={(e) =>
                        setCatForm({ ...catForm, icon: e.target.value })
                      }
                      placeholder="📁"
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 text-sm font-medium"
                >
                  {catLoading ? "Creating..." : "Create Category"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
                <h2 className="text-lg font-bold">
                  {editingTaskId ? "Edit Task" : "New Task"}
                </h2>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setEditingTaskId(null);
                  }}
                  className="hover:bg-white/20 p-1.5 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={saveTask} className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Title
                  </label>
                  <input
                    name="title"
                    value={taskForm.title}
                    onChange={handleTaskInput}
                    placeholder="Task title..."
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={taskForm.description}
                    onChange={handleTaskInput}
                    placeholder="Task description..."
                    rows="3"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={taskForm.priority}
                      onChange={handleTaskInput}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                      Category
                    </label>
                    <select
                      name="category_id"
                      value={taskForm.category_id}
                      onChange={handleTaskInput}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">No category</option>
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    name="due_date"
                    value={taskForm.due_date}
                    onChange={handleTaskInput}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTaskModal(false);
                      setEditingTaskId(null);
                    }}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 text-sm font-medium"
                  >
                    {editingTaskId ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
