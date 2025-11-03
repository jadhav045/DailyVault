import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage/index.js"; // <-- key fix
import { persistReducer, persistStore } from "redux-persist";
import categoryReducer from "./categorySlice.js";
import taskReducer from "./tasksSlice.js";

const persistConfig = {
  key: "root",
  storage,
};

const rootReducer = combineReducers({
  categories: categoryReducer,
  tasks: taskReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // suppress redux-persist serialization warnings
    }),
});

export const persistor = persistStore(store);
