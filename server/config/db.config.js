import mysql from "mysql2";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create MySQL connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true, // ✅ Allow multiple statements in one query
});


// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error("❌ MySQL connection failed:", err);
        return;
    }
    console.log("✅ Connected to MySQL Database!");

    // Read SQL file
    const sqlFilePath = path.join(__dirname, "init.sql");
    const sqlQueries = fs.readFileSync(sqlFilePath, "utf8");

    // Execute SQL queries
    connection.query(sqlQueries, (err, results) => {
        if (err) {
            console.error("❌ Error running SQL queries:", err);
        } else {
            console.log("✅ Database and tables initialized successfully!");
        }
    });
});

export default connection;
