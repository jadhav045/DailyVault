import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import api from "../api/api.js";
import { setCategories } from "../store/categorySlice.js";

const useCategories = (userSecret = {}) => {
  const dispatch = useDispatch();

  const fetchCategories = useCallback(async () => {

    try {
      const res = await api.get("/categories/");
      console.log("📂 Fetched categories response:", res.data.categories);

      if (res.data?.success && Array.isArray(res.data.categories)) {
        dispatch(setCategories(res.data.categories));
      } else {
        console.warn("⚠️ Invalid API response or no categories found:", res.data);
      }
    } catch (err) {
      console.error("❌ Error fetching categories:", err.response || err.message);
    }
  }, [dispatch, userSecret]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {};
};

export default useCategories;
