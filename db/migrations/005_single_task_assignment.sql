BEGIN;

ALTER TABLE bgss_todo.tasks
    ADD COLUMN IF NOT EXISTS assigned_to BIGINT NULL;

DO $$
BEGIN
    IF to_regclass('bgss_todo.task_assignments') IS NOT NULL THEN
        EXECUTE '
            UPDATE bgss_todo.tasks AS tasks
            SET assigned_to = assignments.user_id
            FROM (
                SELECT DISTINCT ON (task_id) task_id, user_id
                FROM bgss_todo.task_assignments
                ORDER BY task_id, user_id
            ) AS assignments
            WHERE tasks.id = assignments.task_id
              AND tasks.assigned_to IS NULL';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tasks_assigned_to_fkey'
          AND conrelid = 'bgss_todo.tasks'::regclass
    ) THEN
        ALTER TABLE bgss_todo.tasks
            ADD CONSTRAINT tasks_assigned_to_fkey
            FOREIGN KEY (assigned_to)
            REFERENCES bgss_todo.users(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DROP TABLE IF EXISTS bgss_todo.task_assignments;

COMMIT;