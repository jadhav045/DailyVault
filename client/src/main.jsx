import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ToastContainer, Slide } from "react-toastify";

import "./index.css";
import "quill/dist/quill.snow.css";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store/store.js"; // ✅ update import
import { ToastProvider } from "./context/ToastContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
          <ToastContainer transition={Slide} />
        </PersistGate>
      </Provider>
    </ToastProvider>
  </React.StrictMode>
);
