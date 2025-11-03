import { createSlice } from "@reduxjs/toolkit";

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    list: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    loading: false,
  },
  reducers: {
    // ------------------ TASK REDUCERS ------------------
    setTasks: (state, action) => {
      const { tasks, total, totalPages, page } = action.payload;
      state.list = tasks;
      state.total = total;
      state.totalPages = totalPages;
      state.page = page;
    },
    addTask: (state, action) => {
      state.list.unshift(action.payload);
    },
    updateTask: (state, action) => {
      const idx = state.list.findIndex(
        (task) => task.task_id === action.payload.task_id
      );
      if (idx !== -1)
        state.list[idx] = { ...state.list[idx], ...action.payload };
    },
    deleteTask: (state, action) => {
      state.list = state.list.filter((task) => task.task_id !== action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // ------------------ SUBTASK REDUCERS ------------------
    setSubtasks: (state, action) => {
      const { task_id, subtasks } = action.payload;
      const task = state.list.find((t) => t.task_id === task_id);
      if (task) {
        task.subtasks = subtasks;
      }
    },
    addSubtask: (state, action) => {
      const { task_id, subtask } = action.payload;
      const task = state.list.find((t) => t.task_id === task_id);
      if (task) {
        if (!task.subtasks) task.subtasks = [];
        task.subtasks.push(subtask);
      }
    },
    updateSubtask: (state, action) => {
      const { task_id, subtask } = action.payload;
      const task = state.list.find((t) => t.task_id === task_id);
      if (task && task.subtasks) {
        const idx = task.subtasks.findIndex(
          (s) => s.subtask_id === subtask.subtask_id
        );
        if (idx !== -1) {
          task.subtasks[idx] = { ...task.subtasks[idx], ...subtask };
        }
      }
    },
    deleteSubtask: (state, action) => {
      const { task_id, subtask_id } = action.payload;
      const task = state.list.find((t) => t.task_id === task_id);
      if (task && task.subtasks) {
        task.subtasks = task.subtasks.filter(
          (s) => s.subtask_id !== subtask_id
        );
      }
    },

    toggleTaskCompletion: (state, action) => {
      const { task_id, is_completed } = action.payload;
      const task = state.list.find((t) => t.task_id === task_id);
      if (task) task.is_completed = is_completed;
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setLoading,
  setSubtasks,
  addSubtask,
  updateSubtask,
  deleteSubtask,
  toggleTaskCompletion,
} = taskSlice.actions;

export default taskSlice.reducer;
