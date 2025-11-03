import axios from "axios";
import api from "./api.js";

export const getSubtasks = async (token, task_id) => {
  const res = await api.get(`/tasks/${task_id}/subtasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.subtasks;
};

export const createSubtask = async (token, task_id, subtaskData) => {
  const res = await api.post(
    `/tasks/${task_id}/subtasks`,
    subtaskData
  );
  return res.data.subtask;
};

export const updateSubtask = async (token, subtask_id, updates) => {
  const res = await api.put(`/tasks/subtasks/${subtask_id}`, updates);
  return res.data.subtask;
};

export const deleteSubtask = async (token, subtask_id) => {
  await api.delete(`/tasks/subtasks/${subtask_id}`);
  return subtask_id;
};
