// NOTE: This code requires a Node.js environment and the 'mysql2' package.
// DO NOT use this for client-side (browser) JavaScript.

const mysql = require("mysql2/promise");

// --- WARNING: Replace these placeholders with your actual, secured credentials ---
const dbConfigBase = {
 
};
// ---------------------------------------------------------------------------------
// NOTE: This code requires a Node.js environment and the 'mysql2' package.

const DB_NAME = "dailyvault"; // The database name we were getting the error for

async function connectAndExecute() {
  let connection;
  try {
    // 1. Establish initial connection to the server (without specifying the database)
    console.log(
      `Attempting to connect to RDS server at ${dbConfigBase.host}...`
    );
    connection = await mysql.createConnection(dbConfigBase);
    console.log("✅ Successfully connected to AWS RDS server!");

    // 2. Create the missing database if it doesn't exist
    const createDbQuery = `CREATE DATABASE IF NOT EXISTS ${DB_NAME};`;
    await connection.execute(createDbQuery);
    console.log(`✅ Database '${DB_NAME}' created or already exists.`);

    // 3. Close the initial connection
    await connection.end();

    // 4. Establish a NEW connection, now pointing to the correct database
    console.log(`Re-connecting to database: ${DB_NAME}...`);
    const dbConfigFull = { ...dbConfigBase, database: DB_NAME };
    connection = await mysql.createConnection(dbConfigFull);
    console.log("✅ Successfully connected to the specified database.");

    // 5. Define and execute the table creation query
    const createTableQuery = `
            CREATE TABLE IF NOT EXISTS Entries (
                entry_id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(100) NOT NULL,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
    await connection.execute(createTableQuery);
    console.log("✅ Table 'Entries' created or already exists.");

    // 6. Define and execute the data insertion query (Using parameterized query for security)
    const insertDataQuery = `
            INSERT INTO Entries (title, content) 
            VALUES (?, ?);
        `;
    const entryData = [
      "First Daily Log",
      "Finished setting up the AWS RDS connection today!",
    ];

    const [insertResult] = await connection.execute(insertDataQuery, entryData);
    console.log(
      `✅ Data added successfully. Inserted ID: ${insertResult.insertId}`
    );

    // 7. Optional: Read data to verify
    const [rows] = await connection.execute("SELECT * FROM Entries");
    console.log("\n--- Verification: Current Table Data ---");
    console.table(rows);
  } catch (error) {
    console.error(
      "❌ An error occurred during database operation:",
      error.message
    );
    console.error("\n*** Common Fixes: ***");
    console.error(
      "1. Check for **typos** in your endpoint URL, username, and password."
    );
    console.error(
      "2. If you are using SQL Server or PostgreSQL, ensure the **port** is correct (1433 or 5432)."
    );
  } finally {
    // 8. Close the final connection
    if (connection) {
      await connection.end();
      console.log("\n👋 Connection successfully closed.");
    }
  }
}

connectAndExecute();
