-- =================================================================
-- DailyVault Application Database Schema (MySQL)
-- Requires MySQL 8.0 or later for the UUID() function.
-- IMPORTANT: All DELIMITER statements have been removed for compatibility with Node.js mysql2 driver.
-- =================================================================

-- 1. TRIGGER FUNCTION (The original generic block has been removed as it was redundant
-- and the logic is better placed in the table-specific triggers below.)

-- =================================================================
-- 2. TABLE CREATION
-- =================================================================

-- Table: Users (UUIDs stored as CHAR(36) in MySQL)
CREATE TABLE IF NOT EXISTS Users (
    user_id CHAR(36) PRIMARY KEY DEFAULT (UUID()), 
    username_enc TEXT NOT NULL,
    email_enc TEXT NOT NULL,
    password_enc TEXT NOT NULL,
    oauth_provider VARCHAR(50),
    oauth_id_enc TEXT,
    otp VARCHAR(10),
    otp_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- MySQL Triggers must be created individually per table
-- Drop and re-create to ensure idempotency
DROP TRIGGER IF EXISTS set_users_timestamp;

CREATE TRIGGER set_users_timestamp
BEFORE UPDATE ON Users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END;


-- Table: Categories
CREATE TABLE IF NOT EXISTS Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY, -- Replaces SERIAL
    user_id CHAR(36) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    color_code VARCHAR(10) DEFAULT '#FFFFFF',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);


-- Table: Tasks
CREATE TABLE IF NOT EXISTS Tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY, -- Replaces SERIAL
    user_id CHAR(36) NOT NULL,
    category_id INT,
    priority_id INT, 
    title_enc TEXT,
    description_enc TEXT,
    due_date DATE,
    -- ENUMs defined inline in MySQL
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    priority_name ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);

-- Apply timestamp trigger
DROP TRIGGER IF EXISTS set_tasks_timestamp;

CREATE TRIGGER set_tasks_timestamp
BEFORE UPDATE ON Tasks
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END;


-- Table: Subtasks
CREATE TABLE IF NOT EXISTS Subtasks (
    subtask_id INT AUTO_INCREMENT PRIMARY KEY, -- Replaces SERIAL
    task_id INT NOT NULL,
    title_enc TEXT,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE
);


-- Table: Notifications
CREATE TABLE IF NOT EXISTS Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY, -- Replaces SERIAL
    user_id CHAR(36) NOT NULL,
    task_id INT,
    message_enc TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    notify_time DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE
);


-- Table: ActivityLog
CREATE TABLE IF NOT EXISTS ActivityLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY, -- Replaces SERIAL
    user_id CHAR(36) NOT NULL,
    task_id INT,
    diary_id INT,
    action_type ENUM('create', 'update', 'delete', 'complete', 'login', 'logout') NOT NULL,
    action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE SET NULL
);


-- Table: DiaryEntries
CREATE TABLE IF NOT EXISTS DiaryEntries (
    entry_id INT AUTO_INCREMENT PRIMARY KEY, -- Replaces SERIAL
    user_id CHAR(36) NOT NULL,
    title_encrypted VARCHAR(1024) NULL,
    content_encrypted TEXT NOT NULL,
    mood ENUM('happy','sad','neutral','excited','angry') DEFAULT 'neutral',
    tags_encrypted VARCHAR(1024) NULL,
    visibility ENUM('Private','Public') DEFAULT 'Private',
    emotion_score FLOAT DEFAULT NULL,
    entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_entries_user_date ON DiaryEntries (user_id, entry_date);
CREATE INDEX idx_entries_user_created ON DiaryEntries (user_id, created_at);

-- Apply timestamp trigger
DROP TRIGGER IF EXISTS set_diaryentries_timestamp;

CREATE TRIGGER set_diaryentries_timestamp
BEFORE UPDATE ON DiaryEntries
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END;
