import { createSlice } from "@reduxjs/toolkit";

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    tasks: [],
  },
  reducers: {
    setTasks: (state, action) => {
      state.tasks = action.payload;
    },
    removeAllTasks: (state) => {
      state.tasks = [];
    },
  },
});

export const { setTasks, removeAllTasks } = taskSlice.actions;
export default taskSlice.reducer;
