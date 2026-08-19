BEGIN;

ALTER TABLE bgss_todo.tasks
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

UPDATE bgss_todo.tasks
SET completed_at = created_at
WHERE completed = TRUE
  AND completed_at IS NULL;

COMMIT;
