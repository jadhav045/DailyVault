-- CREATE DATABASE IF NOT EXISTS idle_todo_secure;
USE dailyvault;

CREATE TABLE IF NOT EXISTS Users (
    user_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),  -- UUID as primary key
    username_enc TEXT NOT NULL,           -- Encrypted username
    email_enc TEXT NOT NULL,              -- Encrypted email
    password_enc TEXT NOT NULL,           -- Encrypted password
    oauth_provider TEXT,                  -- e.g., google/github (optional)
    oauth_id_enc TEXT,                    -- Encrypted OAuth ID if used
    
    otp TEXT,                    -- Encrypted OTP (temporary)
    otp_expires_at DATETIME,              -- When OTP becomes invalid
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS Tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    priority_id INT,
    title_enc TEXT,                       -- Encrypted task title
    description_enc TEXT,                 -- Encrypted description (optional)
    due_date DATE,                        -- Normal (for filtering/sorting)
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    priority_name ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (priority_id) REFERENCES Priorities(priority_id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_name VARCHAR(100) NOT NULL,  -- Normal text (non-sensitive)
    color_code VARCHAR(10) DEFAULT '#FFFFFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Subtasks (
    subtask_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    title_enc TEXT,                       -- Encrypted if private
    status ENUM('pending', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT,
    message_enc TEXT,                     -- Encrypted if it contains sensitive info
    is_read BOOLEAN DEFAULT FALSE,
    notify_time DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ActivityLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT,
    diary_id INT,
    action_type ENUM('create', 'update', 'delete', 'complete', 'login', 'logout') NOT NULL,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS DiaryEntries (
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title_encrypted VARCHAR(1024) NULL,
    content_encrypted LONGTEXT NOT NULL,
    mood ENUM('happy','sad','neutral','excited','angry') DEFAULT 'neutral',
    tags_encrypted VARCHAR(1024) NULL,
    visibility ENUM('Private','Public') DEFAULT 'Private',
    emotion_score FLOAT DEFAULT NULL,
    entry_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- store date + time
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_entries_user_date (user_id, entry_date),
    INDEX idx_entries_user_created (user_id, created_at)
);
