// import pool from '../db.js'; // ⬅️ IMPORT YOUR CONNECTION POOL HERE

import pool from "../config/db.config.js";

/**
 * Creates a new task, logs the activity, and schedules a notification (if provided).
 * Uses the imported 'pool' object for database access.
 */
export const createTask = async (req, res) => {
    // 1. Get user_id from the authenticated session/token (Mocked for context)
    // const user_id = req.user.user_id; // Assumes authentication middleware has run

    // 2. Extract data from the request body
    const { 
        title, 
        description, 
        category_id, 
        due_date, 
        priority_name,
        notification_message,
        notify_time
    } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Task title is required.' });
    }

    // Start Transaction
    let connection;
    try {
        // 3. Get a connection from the pool and start a transaction
        // Use pool.getConnection() to reserve a connection for the transaction.
        connection = await pool.getConnection(); 
        await connection.beginTransaction(); // 🛡️ Ensures atomicity for all three inserts

        // --- A. Insert into Tasks Table ---
        const taskSql = `
            INSERT INTO Tasks 
                (user_id, category_id, title, description, due_date, priority_name)
            VALUES 
                (?, ?, ?, ?, ?, ?)
        `;
        const taskValues = [
            user_id, 
            category_id || null, 
            title, 
            description || null, 
            due_date || null,
            priority_name || 'Medium'
        ];

        // Execute query on the reserved 'connection'
        const [taskResult] = await connection.query(taskSql, taskValues);
        const newTaskId = taskResult.insertId;

        // --- B. Insert into ActivityLog Table ---
        const activitySql = `
            INSERT INTO ActivityLog (user_id, task_id, action_type) 
            VALUES (?, ?, 'create')
        `;
        await connection.query(activitySql, [user_id, newTaskId]);

        // --- C. Insert into Notifications Table (Conditional) ---
        if (notification_message && notify_time) {
            const notificationSql = `
                INSERT INTO Notifications 
                    (user_id, task_id, message_enc, notify_time) 
                VALUES 
                    (?, ?, ?, ?)
            `;
            const notificationValues = [
                user_id, 
                newTaskId, 
                notification_message, 
                notify_time
            ];
            await connection.query(notificationSql, notificationValues);
        }

        // 4. Commit the transaction
        await connection.commit();
        
        // 5. Respond with success
        res.status(201).json({ 
            message: 'Task created successfully.', 
            task_id: newTaskId 
        });

    } catch (error) {
        // 6. Rollback in case of any error (crucial for transactions)
        if (connection) {
            await connection.rollback();
        }
        console.error('Error creating task (Transaction rolled back):', error);
        res.status(500).json({ message: 'Internal Server Error during task creation.' });
        
    } finally {
        // 7. Release the connection back to the pool
        if (connection) {
            connection.release(); // 📦 This is what returns the connection for others to use
        }
    }
};