import React from "react";

const AuthForm = ({ title, children, onSubmit, loading }) => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">{title}</h1>
      <form onSubmit={onSubmit} className="flex flex-col space-y-3">
        {children}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Please wait..." : "Continue"}
        </button>
      </form>
    </div>
  </div>
);

export default AuthForm;
