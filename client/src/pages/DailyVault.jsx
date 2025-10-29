import React, { useEffect, useState, useContext, createContext } from "react";

// --- 0. MINIMAL SELF-CONTAINED REDUX IMPLEMENTATION (To avoid import errors) ---

// 0.1 Create Context for Store and Dispatch
const StoreContext = createContext();

// Mock initial user data
const getCurrentUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    return {
      id: user.id || "mock-user-123",
      email: user.email || "user@vault.com",
      encryptionKey: user.key || "strong-key-123",
    };
  } catch {
    return { id: null, email: null, encryptionKey: null };
  }
};

// Initial State Structure (Based on your taskSlice and required dashboard data)
const initialUser = getCurrentUser();
const initialState = {
  auth: {
    identity: initialUser.id,
    email: initialUser.email,
    encryptionKey: initialUser.encryptionKey,
    authToken: localStorage.getItem("authToken"),
  },
  // Corresponds to your desired 'task' reducer key
  task: {
    tasks: [], // All tasks fetched (similar to your 'taskSlice.js')
    dashboardStats: {
      total: 0,
      completed: 0,
      categories: 0,
      completionRate: 0,
    },
    recentTasks: [],
    loading: false,
    error: null,
  },
  categories: {
    allCategories: [],
  },
};

// 0.2 Root Reducer Definition (Combines task slice logic and async state)
const rootReducer = (state, action) => {
  switch (action.type) {
    case "auth/logout":
      return {
        ...state,
        auth: {
          ...state.auth,
          identity: null,
          email: null,
          encryptionKey: null,
          authToken: null,
        },
      };

    // --- Task Slice Reducers (Synchronous Actions) ---
    case "task/addtask":
      return {
        ...state,
        task: { ...state.task, tasks: [...state.task.tasks, action.payload] },
      };
    case "task/removetask":
      return {
        ...state,
        task: {
          ...state.task,
          tasks: state.task.tasks.filter((t) => t.task_id !== action.payload),
        },
      };

    // --- Async Thunk State Reducers (Dashboard Fetch) ---
    case "data/fetchDashboard/pending":
      return {
        ...state,
        task: { ...state.task, loading: true, error: null },
      };
    case "data/fetchDashboard/fulfilled":
      const { totalTasks, completedTasks, totalCategories, recentTasks } =
        action.payload;
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      return {
        ...state,
        task: {
          ...state.task,
          loading: false,
          dashboardStats: {
            total: totalTasks,
            completed: completedTasks,
            categories: totalCategories,
            completionRate,
          },
          recentTasks: recentTasks,
          tasks: action.payload.allTasks, // Update the main task list
        },
        categories: {
          ...state.categories,
          allCategories: action.payload.allCategories,
        },
      };
    case "data/fetchDashboard/rejected":
      return {
        ...state,
        task: {
          ...state.task,
          loading: false,
          error: action.payload || "Failed to load dashboard.",
        },
      };
    default:
      return state;
  }
};

// 0.3 Custom Hook to manage the global state (Redux-like store)
const useStore = () => {
  const [state, setState] = useState(initialState);

  const dispatch = (action) => {
    if (typeof action === "function") {
      // Handle Thunks (functions)
      const thunkApi = {
        getState: () => state,
        dispatch: dispatch,
        rejectWithValue: (value) => ({
          type: "data/fetchDashboard/rejected",
          payload: value,
        }),
      };
      return action(thunkApi);
    } else {
      // Handle standard actions
      setState((prevState) => rootReducer(prevState, action));
    }
  };

  return { state, dispatch };
};

// 0.4 Provider Component
const StoreProvider = ({ children }) => {
  const { state, dispatch } = useStore();

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
};

// 0.5 Replacement Hooks for useSelector and useDispatch
const useDispatch = () => useContext(StoreContext).dispatch;
const useSelector = (selector) => selector(useContext(StoreContext).state);

// --- 1. MOCK UTILITIES & LIBRARIES ---

const api = {
  get: async (url, config) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (url.includes("/tasks")) {
      const mockTasks = Array(50)
        .fill(0)
        .map((_, i) => ({
          task_id: i + 1,
          title_enc: `Encrypted Task ${i + 1} IV:SALT`,
          status: i % 5 === 0 ? "Completed" : "Pending",
          due_date: `2025-10-${(i % 30) + 1}`,
        }));
      return { data: { tasks: mockTasks } };
    }
    if (url.includes("/categories")) {
      return { data: { categories: [{ id: 1 }, { id: 2 }, { id: 3 }] } };
    }
    return { data: {} };
  },
  post: async (url, data, config) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { data: { message: "Logout successful!" } };
  },
};

// Mock: Decryption (The bottleneck we will fix next!)
const decryptData = async (encryptionKey, encryptedTitle) => {
  await new Promise((resolve) => setTimeout(resolve, 10));
  const mockTitle = encryptedTitle.replace("Encrypted ", "Decrypted ");
  return mockTitle.split(" IV:SALT")[0];
};

const toast = {
  success: (msg) => console.log("TOAST SUCCESS:", msg),
  error: (msg) => console.error("TOAST ERROR:", msg),
};
const useNavigate = () => (path) => console.log("NAVIGATING TO:", path);
const handleApiError = (err, msg) => {
  console.error(msg, err);
};

// --- 2. THUNKS/ACTION CREATORS ---

// Action Creator to handle Logout
const logout = () => (dispatch) => {
  dispatch({ type: "auth/logout" });
};

// Thunk to fetch and process dashboard data
const fetchDashboardData =
  () =>
  async ({ getState, dispatch, rejectWithValue }) => {
    const { identity, encryptionKey } = getState().auth;
    if (!identity) {
      return rejectWithValue("User identity not available.");
    }

    dispatch({ type: "data/fetchDashboard/pending" });
    const params = identity.includes("-")
      ? { user_uuid: identity }
      : { user_id: identity };

    try {
      const [tasksRes, catsRes] = await Promise.all([
        api.get("/tasks", { params }),
        api.get("/categories", { params }),
      ]);

      const allTasks = tasksRes.data.tasks || [];
      const allCategories = catsRes.data.categories || [];

      // Decrypt Recent Tasks - BOTTLENECK
      const recentRaw = allTasks.slice(0, 5);
      const recentDecrypted = await Promise.all(
        recentRaw.map(async (t) => {
          let title = t.title_enc;
          try {
            title =
              t.title_enc && encryptionKey
                ? await decryptData(encryptionKey, t.title_enc)
                : t.title_enc;
          } catch (e) {
            title = "[unable to decrypt]";
          }
          return {
            task_id: t.task_id,
            title,
            status: t.status,
            due_date: t.due_date,
          };
        })
      );

      const completedTasks = allTasks.filter(
        (t) => t.status === "Completed"
      ).length;

      dispatch({
        type: "data/fetchDashboard/fulfilled",
        payload: {
          totalTasks: allTasks.length,
          completedTasks,
          totalCategories: allCategories.length,
          recentTasks: recentDecrypted,
          allTasks,
          allCategories,
        },
      });
    } catch (err) {
      dispatch({
        type: "data/fetchDashboard/rejected",
        payload: "Failed to fetch dashboard data.",
      });
      handleApiError(err, "Failed to load dashboard data");
    }
  };

// --- 3. CUSTOM HOOK FOR FETCHING (As requested) ---

// This hook manages the lifecycle of fetching data and returns the necessary state.
const useFetchDashboardData = () => {
  const dispatch = useDispatch();
  const identity = useSelector((state) => state.auth.identity);
  // Select the whole task slice
  const taskState = useSelector((state) => state.task);

  // Fetch data on mount and identity change
  useEffect(() => {
    const fetchData = async () => {
      // Note: Unlike useAllClubs, we don't clear the state here
      // because clearing would flash the dashboard stats.
      // The thunk handles updating the state on success.
      if (identity) {
        dispatch(fetchDashboardData());
      }
    };

    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (identity) {
        dispatch(fetchDashboardData());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch, identity]);

  return {
    // Return structured data for the Dashboard component
    loading: taskState.loading,
    dashboardStats: taskState.dashboardStats,
    recentTasks: taskState.recentTasks,
    completionRate: taskState.dashboardStats.completionRate,
  };
};
export 