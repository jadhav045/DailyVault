import db from "../config/db.js";

// ------------------ CREATE CATEGORY ------------------
export const createCategory = async (req, res) => {
  try {
    const { category_name, color_code } = req.body;
    const user_id = req.user.id;

    console.log("Creating category for user:", user_id);

    if (!category_name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Insert new category
    const [result] = await db.query(
      "INSERT INTO Categories (user_id, category_name, color_code) VALUES (?, ?, ?)",
      [user_id, category_name, color_code || "#FFFFFF"]
    );

    // Return structured category object
    const newCategory = {
      category_id: result.insertId,
      category_name,
      color_code: color_code || "#FFFFFF",
      user_id,
    };

    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("❌ Error creating category:", error);
    res.status(500).json({ message: "Server error while creating category" });
  }
};


// ------------------ GET ALL CATEGORIES ------------------
export const getCategories = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [rows] = await db.query(
      "SELECT * FROM Categories WHERE user_id = ? ORDER BY created_at DESC",
      [user_id]
    );

    res.status(200).json({
      success: true,
      total: rows.length,
      categories: rows,
    });
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
    });
  }
};

// ------------------ UPDATE CATEGORY ------------------
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, color_code } = req.body;
    const user_id = req.user.id;

    const [result] = await db.query(
      "UPDATE Categories SET category_name=?, color_code=? WHERE category_id=? AND user_id=?",
      [category_name, color_code, id, user_id]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ message: "Category not found or unauthorized" });

    res.json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ DELETE SINGLE CATEGORY ------------------
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const [result] = await db.query(
      "DELETE FROM Categories WHERE category_id=? AND user_id=?",
      [id, user_id]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ message: "Category not found or unauthorized" });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ DELETE MULTIPLE CATEGORIES ------------------
export const deleteMultipleCategories = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { ids } = req.body; // expect: { ids: [1, 2, 3] }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide an array of category IDs" });
    }

    // Safely build query placeholders
    const placeholders = ids.map(() => "?").join(",");
    const params = [...ids, user_id];

    const [result] = await db.query(
      `DELETE FROM Categories WHERE category_id IN (${placeholders}) AND user_id = ?`,
      params
    );

    res.json({
      message: `${result.affectedRows} categories deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting multiple categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};
