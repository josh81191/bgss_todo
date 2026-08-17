-- Final demo seed: resets users, projects, and tasks to a clean, presentable state.
-- Run this against a development/demo database only; it truncates existing data.
BEGIN;

TRUNCATE TABLE bgss_todo.tasks RESTART IDENTITY CASCADE;
TRUNCATE TABLE bgss_todo.projects RESTART IDENTITY CASCADE;
TRUNCATE TABLE bgss_todo.users RESTART IDENTITY CASCADE;

INSERT INTO bgss_todo.users (name, username, password, role)
VALUES
    ('Manager Sam', 'manager', '123', 'manager'),
    ('Aye Aye', 'aye', '123', 'staff'),
    ('Nang Nang', 'nang', '123', 'staff'),
    ('Zomi Zomi', 'zomi', '123', 'staff'),
    ('Htet Htet', 'htet', '123', 'staff');

INSERT INTO bgss_todo.projects (name, slug)
VALUES
    ('Home', 'home'),
    ('Mineco', 'mineco'),
    ('BGSS Office', 'bgss-office');

-- Manager-created tasks assigned to different staff, across projects and priorities.
INSERT INTO bgss_todo.tasks (description, comment, priority, deadline, completed, created_by, assigned_to, project_id, created_at)
VALUES
    (
        'Collect pending work and prepare a summary for the weekly review.',
        'Focus on the Mineco workstream first.',
        'urgent',
        NOW() + INTERVAL '2 days',
        FALSE,
        (SELECT id FROM bgss_todo.users WHERE username = 'manager'),
        (SELECT id FROM bgss_todo.users WHERE username = 'aye'),
        (SELECT id FROM bgss_todo.projects WHERE slug = 'mineco'),
        NOW() - INTERVAL '1 day'
    ),
    (
        'Verify stationery, printer paper, and desk materials for tomorrow.',
        '',
        'normal',
        NOW() + INTERVAL '5 days',
        FALSE,
        (SELECT id FROM bgss_todo.users WHERE username = 'manager'),
        (SELECT id FROM bgss_todo.users WHERE username = 'zomi'),
        (SELECT id FROM bgss_todo.projects WHERE slug = 'bgss-office'),
        NOW() - INTERVAL '2 hours'
    ),
    (
        'Archive last quarter''s reports and update the shared drive index.',
        'Already sorted by month, just needs uploading.',
        'normal',
        NOW() - INTERVAL '3 days',
        TRUE,
        (SELECT id FROM bgss_todo.users WHERE username = 'manager'),
        (SELECT id FROM bgss_todo.users WHERE username = 'nang'),
        (SELECT id FROM bgss_todo.projects WHERE slug = 'home'),
        NOW() - INTERVAL '6 days'
    );

-- Staff-created tasks: creators can edit description, priority, and assignment on these.
INSERT INTO bgss_todo.tasks (description, comment, priority, deadline, completed, created_by, assigned_to, project_id, created_at)
VALUES
    (
        'Follow up with the vendor about the delayed delivery.',
        'Called once already, no response yet.',
        'urgent',
        NOW() + INTERVAL '1 day',
        FALSE,
        (SELECT id FROM bgss_todo.users WHERE username = 'aye'),
        (SELECT id FROM bgss_todo.users WHERE username = 'aye'),
        (SELECT id FROM bgss_todo.projects WHERE slug = 'mineco'),
        NOW() - INTERVAL '3 hours'
    ),
    (
        'Prepare the onboarding checklist for the new hire.',
        '',
        'normal',
        NOW() + INTERVAL '7 days',
        FALSE,
        (SELECT id FROM bgss_todo.users WHERE username = 'nang'),
        (SELECT id FROM bgss_todo.users WHERE username = 'zomi'),
        (SELECT id FROM bgss_todo.projects WHERE slug = 'bgss-office'),
        NOW() - INTERVAL '1 hour'
    ),
    (
        'Water the office plants and check the AC filters.',
        'Done every Monday.',
        'normal',
        NULL,
        FALSE,
        (SELECT id FROM bgss_todo.users WHERE username = 'htet'),
        (SELECT id FROM bgss_todo.users WHERE username = 'htet'),
        (SELECT id FROM bgss_todo.projects WHERE slug = 'home'),
        NOW() - INTERVAL '30 minutes'
    ),
    (
        'Draft the client proposal outline for review.',
        'Waiting on figures from finance.',
        'urgent',
        NOW() - INTERVAL '1 day',
        FALSE,
        (SELECT id FROM bgss_todo.users WHERE username = 'zomi'),
        (SELECT id FROM bgss_todo.users WHERE username = 'aye'),
        (SELECT id FROM bgss_todo.projects WHERE slug = 'mineco'),
        NOW() - INTERVAL '2 days'
    );

COMMIT;
