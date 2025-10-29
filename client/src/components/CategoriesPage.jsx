import React from "react";
import useCategories from "../hooks/useCategories";
// import CategoryForm from "../components/CategoryForm";
// import CategoryList from "../components/CategoryList";
import CategoryForm from "./categoryForm";
import CategoryList from "./CategoryList";

export default function CategoriesPage() {
  const { categories, createCategory, editCategory, removeCategory } =
    useCategories();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">
        🗂 Manage Categories
      </h1>

      <CategoryForm onSubmit={createCategory} />
      <CategoryList
        categories={categories}
        onEdit={editCategory}
        onDelete={removeCategory}
      />
    </div>
  );
}
