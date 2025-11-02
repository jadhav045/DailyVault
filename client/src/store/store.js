import { configureStore } from "@reduxjs/toolkit";
import taskReducer from "../store/tasksSlice.js"; // Import your slice
import categoryReducer from "./categorySlice.js";
const store = configureStore({
  reducer: {
    tasks: taskReducer, // Add your reducers here
        categories: categoryReducer,

  },
});

export default store;
