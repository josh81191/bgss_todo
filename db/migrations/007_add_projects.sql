BEGIN;

CREATE TABLE IF NOT EXISTS bgss_todo.projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO bgss_todo.projects (name, slug)
VALUES
    ('Home', 'home'),
    ('Mineco', 'mineco')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE bgss_todo.tasks
    ADD COLUMN IF NOT EXISTS project_id BIGINT NULL REFERENCES bgss_todo.projects(id) ON DELETE SET NULL;

-- Backfill existing tasks under the default project (Mineco).
UPDATE bgss_todo.tasks
SET project_id = (SELECT id FROM bgss_todo.projects WHERE slug = 'mineco' LIMIT 1)
WHERE project_id IS NULL;

ALTER TABLE bgss_todo.tasks
    ALTER COLUMN project_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON bgss_todo.tasks(project_id);

COMMIT;
