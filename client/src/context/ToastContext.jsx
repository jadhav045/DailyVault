// src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ message, type }) {
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div
      className={`animate-slideIn flex items-center text-white px-4 py-3 rounded-lg shadow-lg min-w-[250px] ${colors[type]} transition-all`}
    >
      {type === "success" && <span className="mr-2">✅</span>}
      {type === "error" && <span className="mr-2">❌</span>}
      {type === "info" && <span className="mr-2">ℹ️</span>}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
