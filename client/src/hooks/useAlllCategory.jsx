import { useEffect } from "react";
import { useDispatch } from "react-redux";
import api from "../api/axios.js";
import { setCategories } from "../store/categorySlice.js";

const useCategories = (userSecret = {}) => {
  const dispatch = useDispatch();

  const fetchCategories = async () => {
    if (!userSecret) {
      console.warn("⚠️ No userSecret found, skipping category fetch.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // console.log("📦 Fetching all tasks with filters:", filters);

      // Fetch data without pagination parameters
      const res = await api.get("/categories", {
        headers,
      });

      console.log("📂 Fetched categories response:", res.data.categories);
      // Assuming the response structure is the same but without totalPages
      if (res.data?.success && Array.isArray(res.data.categories)) {
        dispatch(setCategories(res.data.categories));
      } else {
        console.warn(
          "⚠️ Invalid API response or no categories found:",
          res.data
        );
      }
    } catch (err) {
      console.error(
        "❌ Error fetching categories:",
        err.response || err.message
      );
    }
  };

  // Fetch tasks only when userSecret or filters change.
  // This replaces the complex pagination state dependencies.
  useEffect(() => {
    fetchCategories();
  }, [userSecret, ]); // Stringify filters to use as a stable dependency

  // The hook returns nothing as its primary job is a side-effect (fetching and dispatching).
  return {};
};

export default useCategories;
