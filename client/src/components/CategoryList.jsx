import React from "react";
import { useSelector } from "react-redux";

const CategoryList = () => {
  const categories = useSelector((state) => state.categories.list);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Categories</h2>
      <ul>
        {categories.map((cat) => (
          <li
            key={cat.category_id}
            style={{ backgroundColor: cat.color_code }}
            className="rounded px-3 py-1 mb-2"
          >
            {cat.category_name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryList;
