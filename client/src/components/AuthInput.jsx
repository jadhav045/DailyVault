import React from "react";

const AuthInput = ({ label, type = "text", value, onChange, ...rest }) => (
  <div className="flex flex-col mb-4">
    <label className="mb-1 font-medium text-gray-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="border rounded-lg px-3 py-2 focus:ring focus:ring-blue-300 outline-none"
      {...rest}
    />
  </div>
);

export default AuthInput;
