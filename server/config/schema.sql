-- ==========================================================
-- 1. CORE TABLES
-- ==========================================================

-- Table: Users (Authentication & Identity)
CREATE TABLE IF NOT EXISTS Users (
    user_id CHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash CHAR(60) NOT NULL,
    oauth_provider VARCHAR(50),
    oauth_id_enc TEXT,
    otp VARCHAR(10),
    is_verified BOOLEAN DEFAULT FALSE,
    otp_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: Categories (Project Context)
CREATE TABLE IF NOT EXISTS Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    color_code VARCHAR(10) DEFAULT '#FFFFFF',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);


-- Table: Tasks
CREATE TABLE IF NOT EXISTS Tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);


-- Table: Subtasks (Checklist Items)
CREATE TABLE IF NOT EXISTS Subtasks (
    subtask_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE
);


-- Table: Notifications
CREATE TABLE IF NOT EXISTS Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    task_id INT,
    message_enc TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    notify_time DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE
);


-- Table: DiaryEntries (Journaling Component)
CREATE TABLE IF NOT EXISTS DiaryEntries (
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    title_encrypted VARCHAR(1024),
    content_encrypted TEXT NOT NULL,
    mood ENUM('happy','sad','neutral','excited','angry') DEFAULT 'neutral',
    tags_encrypted VARCHAR(1024),
    visibility ENUM('private','public') DEFAULT 'private',
    emotion_score FLOAT DEFAULT NULL,
    entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);


-- Table: ActivityLog (Tracks all major user/task/diary actions)
CREATE TABLE IF NOT EXISTS ActivityLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    task_id INT,
    diary_id INT,
    action_type ENUM('create', 'update', 'delete', 'complete', 'login', 'logout') NOT NULL,
    details TEXT DEFAULT NULL,
    action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE SET NULL,
    FOREIGN KEY (diary_id) REFERENCES DiaryEntries(entry_id) ON DELETE SET NULL
);


-- ==========================================================
-- 2. INDEXES (Performance Optimization)
-- ==========================================================

-- Note: MySQL does not support CREATE INDEX IF NOT EXISTS.
-- We make this idempotent by dropping the index first (DROP INDEX IF EXISTS ... ON <table>)
-- then recreating it. If your MySQL version does not support DROP INDEX IF EXISTS,
-- remove `IF EXISTS` or use an INFORMATION_SCHEMA check before running.

-- -- Diary lookups (by user/date)
-- DROP INDEX IF EXISTS idx_entries_user_date ON DiaryEntries;
-- CREATE INDEX idx_entries_user_date ON DiaryEntries (user_id, entry_date);

-- DROP INDEX IF EXISTS idx_entries_user_created ON DiaryEntries;
-- CREATE INDEX idx_entries_user_created ON DiaryEntries (user_id, created_at);

-- -- Categories lookup per user
-- DROP INDEX IF EXISTS idx_categories_user ON Categories;
-- CREATE INDEX idx_categories_user ON Categories (user_id);

-- -- Task filtering by user, status, and priority
-- DROP INDEX IF EXISTS idx_tasks_user_status_priority ON Tasks;
-- CREATE INDEX idx_tasks_user_status_priority ON Tasks (user_id, status, priority);

-- -- Notification quick access
-- DROP INDEX IF EXISTS idx_notifications_user_read ON Notifications;
-- CREATE INDEX idx_notifications_user_read ON Notifications (user_id, is_read);

-- -- Activity log lookup by user and time
-- DROP INDEX IF EXISTS idx_activity_user_time ON ActivityLog;
-- CREATE INDEX idx_activity_user_time ON ActivityLog (user_id, action_time);
