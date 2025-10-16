import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ToastContainer, Slide } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { ToastContainer, Slide } from "react-toastify";
import "./index.css";
import "quill/dist/quill.snow.css";

ReactDOM.createRoot(document.getElementById("root")).render(

  <React.StrictMode>
    <App />
    <ToastContainer
      position="bottom-right"        // move to left-bottom
      autoClose={2000}             // 2 seconds
      hideProgressBar={true}       // hide progress bar
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      limit={3}
      transition={Slide}           // smooth slide effect
      toastClassName="custom-toast" // custom class for small design
    />
  </React.StrictMode>

);
