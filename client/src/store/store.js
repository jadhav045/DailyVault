import { configureStore } from "@reduxjs/toolkit";
import taskReducer from "../store/tasksSlice.js"; // Import your slice

const store = configureStore({
  reducer: {
    tasks: taskReducer, // Add your reducers here
  },
});

export default store;
