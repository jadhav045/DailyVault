// NOTE: This script assumes your AWS RDS instance is running MySQL.
import mysql from 'mysql2/promise'; // ✅ Import the 'mysql2/promise' package
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to safely clean environment variables
const cleanEnvVar = (value) => {
    if (!value) return value;
    // Trim whitespace and remove surrounding quotes if they exist
    return value.trim().replace(/^['"]|['"]$/g, '');
};

// --- 1. MySQL RDS Connection Configuration ---
// We use a detailed object instead of a single connection string.
const poolConfig = {
    // Apply cleanEnvVar to ensure no accidental quotes or whitespace cause DNS issues
    host: cleanEnvVar(process.env.RDS_HOST),          // e.g., my-db.xxxx.us-east-1.rds.amazonaws.com
    user: cleanEnvVar(process.env.RDS_USER),          // Your Master Username
    password: cleanEnvVar(process.env.RDS_PASSWORD),      // Your Master Password
    database: cleanEnvVar(process.env.RDS_DATABASE),      // e.g., dailyvault
    port: cleanEnvVar(process.env.RDS_PORT) || 3306,  // Default MySQL port is 3306
    waitForConnections: true,
    connectionLimit: 10, // Max number of concurrent connections
    queueLimit: 0,
        multipleStatements: true, // <<< FIX: Allows the execution of multiple statements in one call

};

// ✅ Create a MySQL connection pool
const pool = mysql.createPool(poolConfig);
console.log("✅ MySQL Connection Pool created.");

// ✅ Self-invoking async function to run the initialization script on startup
(async () => {
    console.log("🚀 Initializing MySQL database...");
    let connection;
    try {
        // We read the MySQL schema file you provided
        const sqlFilePath = path.join(__dirname, "dailyvault_mysql_schema.sql");
        const sqlQueries = fs.readFileSync(sqlFilePath, "utf8");

        // 2. Get a connection from the pool and run the queries
        connection = await pool.getConnection(); 
        
        // NOTE: MySQL requires the script to be run line-by-line or separated by delimiter.
        // For a full schema script (like the one you created with DELIMITER //),
        // we use a specific function to handle multi-statement execution.
        
        // Execute the entire SQL script, allowing multiple statements (required for triggers)
        await connection.query(sqlQueries); 
        
        console.log("✅ Database and tables initialized successfully!");
    } catch (err) {
        console.error("❌ Error running SQL initialization script:", err.message);
        // Hint for common RDS issues, even though connectivity was solved earlier
        console.error("HINT: Verify your RDS host, user, password, and security group settings.");
    } finally {
        // ✅ IMPORTANT: Release the connection back to the pool
        if (connection) {
            connection.release(); 
            console.log("📦 Database initialization client released.");
        }
    }
})();

export default pool;
