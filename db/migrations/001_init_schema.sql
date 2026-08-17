BEGIN;

CREATE SCHEMA IF NOT EXISTS bgss_todo;

CREATE TYPE bgss_todo.user_role AS ENUM ('manager', 'staff');
CREATE TYPE bgss_todo.task_priority AS ENUM ('normal', 'urgent');

CREATE TABLE bgss_todo.users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role bgss_todo.user_role NOT NULL DEFAULT 'staff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bgss_todo.tasks (
        assigned_to BIGINT NULL REFERENCES bgss_todo.users(id) ON DELETE SET NULL,
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority bgss_todo.task_priority NOT NULL DEFAULT 'normal',
    deadline TIMESTAMPTZ NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_by BIGINT NOT NULL REFERENCES bgss_todo.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bgss_todo.task_assignments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES bgss_todo.tasks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES bgss_todo.users(id) ON DELETE CASCADE,
    assigned_by BIGINT NOT NULL REFERENCES bgss_todo.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (task_id, user_id)
);

CREATE INDEX idx_users_username ON bgss_todo.users(username);
CREATE INDEX idx_tasks_created_by ON bgss_todo.tasks(created_by);
CREATE INDEX idx_tasks_completed ON bgss_todo.tasks(completed);
CREATE INDEX idx_tasks_priority ON bgss_todo.tasks(priority);
CREATE INDEX idx_tasks_deadline ON bgss_todo.tasks(deadline);

CREATE INDEX idx_task_assignments_task_id ON bgss_todo.task_assignments(task_id);
CREATE INDEX idx_task_assignments_user_id ON bgss_todo.task_assignments(user_id);

COMMIT;
