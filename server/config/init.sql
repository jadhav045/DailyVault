-- ✅ Enable the pgcrypto extension to generate UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ✅ Define custom ENUM types only if they don't already exist
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM('pending', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM('Low', 'Medium', 'High', 'Critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subtask_status AS ENUM('pending', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE action_log_type AS ENUM('create', 'update', 'delete', 'complete', 'login', 'logout');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE mood_type AS ENUM('happy','sad','neutral','excited','angry');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE visibility_type AS ENUM('Private','Public');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ✅ Create a reusable function to update the 'updated_at' timestamp
-- CREATE OR REPLACE is already idempotent
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =================================================================
-- ✅ TABLE CREATION (Using IF NOT EXISTS)
-- =================================================================

CREATE TABLE IF NOT EXISTS Users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    username_enc TEXT NOT NULL,
    email_enc TEXT NOT NULL,
    password_enc TEXT NOT NULL,
    oauth_provider TEXT,
    oauth_id_enc TEXT,
    otp TEXT,
    otp_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Drop trigger before creating it to make it idempotent
DROP TRIGGER IF EXISTS set_users_timestamp ON Users;
CREATE TRIGGER set_users_timestamp
BEFORE UPDATE ON Users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();


CREATE TABLE IF NOT EXISTS Categories (
    category_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    color_code VARCHAR(10) DEFAULT '#FFFFFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS Tasks (
    task_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    category_id INT,
    priority_id INT, 
    title_enc TEXT,
    description_enc TEXT,
    due_date DATE,
    status task_status DEFAULT 'pending',
    priority_name priority_level DEFAULT 'Medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS set_tasks_timestamp ON Tasks;
CREATE TRIGGER set_tasks_timestamp
BEFORE UPDATE ON Tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();


CREATE TABLE IF NOT EXISTS Subtasks (
    subtask_id SERIAL PRIMARY KEY,
    task_id INT NOT NULL,
    title_enc TEXT,
    status subtask_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS Notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    task_id INT,
    message_enc TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    notify_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS ActivityLog (
    log_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    task_id INT,
    diary_id INT,
    action_type action_log_type NOT NULL,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS DiaryEntries (
    entry_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    title_encrypted VARCHAR(1024) NULL,
    content_encrypted TEXT NOT NULL,
    mood mood_type DEFAULT 'neutral',
    tags_encrypted VARCHAR(1024) NULL,
    visibility visibility_type DEFAULT 'Private',
    emotion_score FLOAT DEFAULT NULL,
    entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_entries_user_date ON DiaryEntries (user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_entries_user_created ON DiaryEntries (user_id, created_at);

DROP TRIGGER IF EXISTS set_diaryentries_timestamp ON DiaryEntries;
CREATE TRIGGER set_diaryentries_timestamp
BEFORE UPDATE ON DiaryEntries
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();