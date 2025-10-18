// import mysql from "mysql2";
// import fs from "fs";
// import path from "path";
// import dotenv from "dotenv";
// import { fileURLToPath } from "url";
// import { dirname } from "path";

// dotenv.config();

// // For __dirname in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // Create MySQL connection
// const connection = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     multipleStatements: true, // ✅ Allow multiple statements in one query
// });


// // Connect to MySQL
// connection.connect((err) => {
//     if (err) {
//         console.error("❌ MySQL connection failed:", err);
//         return;
//     }
//     console.log("✅ Connected to MySQL Database!");

//     // Read SQL file
//     const sqlFilePath = path.join(__dirname, "init.sql");
//     const sqlQueries = fs.readFileSync(sqlFilePath, "utf8");

//     // Execute SQL queries
//     connection.query(sqlQueries, (err, results) => {
//         if (err) {
//             console.error("❌ Error running SQL queries:", err);
//         } else {
//             console.log("✅ Database and tables initialized successfully!");
//         }
//     });
// });

// export default connection;


import { Pool } from "pg"; // ✅ Import the Pool class from pg
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Create a PostgreSQL connection pool
// This is more efficient than a single connection for web apps.
// It uses a single connection string from services like Supabase or Neon.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ Self-invoking async function to run the initialization script on startup
(async () => {
  console.log("🚀 Initializing database...");
  const client = await pool.connect(); // Get a client from the pool
  try {
    const sqlFilePath = path.join(__dirname, "init.sql");
    const sqlQueries = fs.readFileSync(sqlFilePath, "utf8");
    
    await client.query(sqlQueries); // Execute the entire SQL script
    console.log("✅ Database and tables initialized successfully!");
  } catch (err) {
    console.error("❌ Error running SQL initialization script:", err);
  } finally {
    client.release(); // ✅ IMPORTANT: Release the client back to the pool
    console.log("📦 Database initialization client released.");
  }
})();

export default pool;