import axios from "axios";
import api from "./api";

export const getTasks = async (token, page = 1, limit = 10, filters = {}) => {
  const params = new URLSearchParams({ page, limit, ...filters }).toString();
  const res = await api.get(`/tasks?${params}`);
  return res.data;
};

export const createTask = async (token, data) => {
  const res = await api.post("/tasks", data);
  return res.data;
};

export const updateTask = async (token, id, data) => {
  console.log("Updating task:", id, data);  
  const res = await api.put(`/tasks/${id}`, data);

  return res.data;
};

export const deleteTask = async (token, id) => {
  const res = await api.delete(`/tasks/${id}`);
  return res.data;
};
