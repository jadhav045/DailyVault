import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeAllTasks, setTasks } from "../store/tasksSlice.js";
import { decryptData } from "../utils/crypto.js";
import api from "../api/axios.js";

const usePaginatedTasks = (userSecret, filters = {}) => {
  const dispatch = useDispatch();
  const tasks = useSelector((store) => store.tasks.tasks);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async (pageNum = 1) => {
    if (!userSecret) {
      console.warn("⚠️ No userSecret found, skipping fetch");
      return;
    }

    setLoading(true);
    dispatch(removeAllTasks());

    try {
      const token = localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      console.log("📦 Fetching tasks with filters:", filters, "page:", pageNum);

      const res = await api.get("/tasks", {
        headers,
        params: { ...filters, page: pageNum },
      });

      if (res.data?.success && Array.isArray(res.data.tasks)) {
        const decryptedTasks = await Promise.all(
          res.data.tasks.map(async (t) => ({
            ...t,
            title: await decryptData(userSecret, t.title_enc),
            description: await decryptData(userSecret, t.description_enc),
          }))
        );

        dispatch(setTasks(decryptedTasks));
        setTotalPages(res.data.totalPages || 1);
      } else {
        console.warn("⚠️ Invalid API response:", res.data);
      }
    } catch (err) {
      console.error("❌ Error fetching tasks:", err.response || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when page or filters change
  useEffect(() => {
    fetchTasks(page);
  }, [page, filters, userSecret]);

  return { tasks, page, totalPages, setPage, loading };
};

export default usePaginatedTasks;
