import api from "../api/axios.js";

// Normalize payloads to match backend field names
export const getTasks = (params) => api.get("/tasks", { params });

export const createTask = (payload) => {
  // Ensure fields match backend
  const normalized = {
    ...payload,
    title_enc: payload.title_encrypted || payload.title_enc,
    description_enc: payload.description_encrypted || payload.description_enc
  };
  delete normalized.title_encrypted;
  delete normalized.description_encrypted;
  return api.post("/tasks", normalized);
};

export const updateTask = (id, payload) => {
  // Ensure fields match backend
  const normalized = {
    ...payload,
    title_enc: payload.title_encrypted || payload.title_enc,
    description_enc: payload.description_encrypted || payload.description_enc
  };
  delete normalized.title_encrypted;
  delete normalized.description_encrypted;
  return api.put(`/tasks/${id}`, normalized);
};

export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const patchTaskStatus = (id, status) => api.patch(`/tasks/${id}/status`, { status });

export const getCategories = (params) => api.get("/categories", { params });
export const createCategory = (payload) => api.post("/categories", payload);

export const getSubtasks = (taskId) => api.get(`/subtasks/task/${taskId}`);
export const createSubtask = (payload) => api.post("/subtasks", payload);
export const patchSubtaskStatus = (id, status) => api.patch(`/subtasks/${id}/status`, { status });
export const deleteSubtask = (id) => api.delete(`/subtasks/${id}`);
