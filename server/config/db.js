import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Helper: Clean environment variables
const cleanEnvVar = (value) => {
  if (!value) return value;
  return value.trim().replace(/^['"]|['"]$/g, "");
};

// ✅ Database configuration
const dbConfig = {
  host: cleanEnvVar(process.env.RDS_HOST),
  user: cleanEnvVar(process.env.RDS_USER),
  password: cleanEnvVar(process.env.RDS_PASSWORD),
  database: cleanEnvVar(process.env.RDS_DATABASE || "dailyvault"),
  port: cleanEnvVar(process.env.RDS_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
};

// ✅ Create connection pool
const db = mysql.createPool(dbConfig);
console.log(`✅ Connected to MySQL Database: ${dbConfig.database}`);

// ✅ Auto-run schema initialization
(async () => {
  let connection;
  try {
    const sqlFilePath = path.join(__dirname, "schema.sql");
    if (!fs.existsSync(sqlFilePath)) {
      console.log("⚠️ No schema.sql found. Skipping initialization.");
      return;
    }

    const sqlQueries = fs.readFileSync(sqlFilePath, "utf8");
    connection = await db.getConnection();
    await connection.query(sqlQueries);

    console.log("✅ Database schema initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    console.error(
      "HINT: Check RDS host/user/password/database name and your schema.sql syntax."
    );
  } finally {
    if (connection) {
      connection.release();
      console.log("📦 Database connection released after initialization.");
    }
  }
})();

export default db;
