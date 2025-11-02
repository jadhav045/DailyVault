import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ToastContainer, Slide } from "react-toastify";

import "./index.css";
import "quill/dist/quill.snow.css";

import { Provider } from "react-redux";
import store from "./store/store";
import { ToastProvider } from "./context/ToastContext";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </ToastProvider>
  </React.StrictMode>
);
