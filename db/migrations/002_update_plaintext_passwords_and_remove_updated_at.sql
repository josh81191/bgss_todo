BEGIN;

ALTER TABLE bgss_todo.users
    RENAME COLUMN password_hash TO password;

ALTER TABLE bgss_todo.users
    ALTER COLUMN password TYPE VARCHAR(255);

ALTER TABLE bgss_todo.users
    DROP COLUMN IF EXISTS updated_at;

ALTER TABLE bgss_todo.tasks
    DROP COLUMN IF EXISTS updated_at;

COMMIT;
