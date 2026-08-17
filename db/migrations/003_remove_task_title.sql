BEGIN;

ALTER TABLE bgss_todo.tasks
    DROP COLUMN IF EXISTS title;

COMMIT;
