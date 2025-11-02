import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";
import { decryptData,encryptData } from "../utils/crypto";

// Fetch diarys (decrypt after fetching)
export const fetchdiarys = createAsyncThunk(
  "diarys/fetchdiarys",
  async ({ userSecret }, { rejectWithValue }) => {
    try {
      const res = await api.get("/diarys");
      const diarys = await Promise.all(
        res.data.map(async (diary) => {
          try {
            return await decryptData(userSecret, diary.encrypted_data);
          } catch {
            console.warn("Decryption failed for a diary");
            return null;
          }
        })
      );
      return diarys.filter(Boolean);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Fetch failed");
    }
  }
);

// Add a new diary (encrypt before sending)
export const adddiary = createAsyncThunk(
  "diarys/adddiary",
  async ({ userSecret, diary }, { rejectWithValue }) => {
    try {
      const encrypted = await encryptData(userSecret, diary);
      const res = await api.post("/diarys", { encrypted_data: encrypted });
      return diary; // Return decrypted object for Redux
    } catch (err) {
      return rejectWithValue(err.response?.data || "Add failed");
    }
  }
);

const diarySlice = createSlice({
  name: "diarys",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    cleardiarys: (state) => {
      state.list = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchdiarys.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchdiarys.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchdiarys.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(adddiary.fulfilled, (state, action) => {
        state.list.push(action.payload);
      });
  },
});

export const { cleardiarys } = diarySlice.actions;
export default diarySlice.reducer;
