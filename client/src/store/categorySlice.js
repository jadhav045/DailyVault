import { createSlice } from "@reduxjs/toolkit";

const categorySlice = createSlice({
  name: "categories",
  initialState: {
    list: [],
  },
  reducers: {
    setCategories: (state, action) => {
      state.list = action.payload;
    },
    addCategory: (state, action) => {
      state.list.push(action.payload);
    },
    updateCategory: (state, action) => {
      const idx = state.list.findIndex(
        (cat) => cat.category_id === action.payload.category_id
      );
      if (idx !== -1) state.list[idx] = action.payload;
    },
    deleteCategory: (state, action) => {
      state.list = state.list.filter(
        (cat) => cat.category_id !== action.payload
      );
    },
  },
});

export const { setCategories, addCategory, updateCategory, deleteCategory } =
  categorySlice.actions;

export default categorySlice.reducer;
