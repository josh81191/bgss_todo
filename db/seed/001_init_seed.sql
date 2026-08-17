BEGIN;

INSERT INTO bgss_todo.users (name, username, password, role)
VALUES
    ('Manager Sam', 'manager', '123', 'manager'),
    ('Aye Aye', 'aye', '123', 'staff'),
    ('Nang', 'nang', '123', 'staff'),
    ('Zomi', 'zomi', '123', 'staff');

INSERT INTO bgss_todo.tasks (description, priority, deadline, completed, created_by, assigned_to)
VALUES
    (
        'Collect pending work and prepare summary for the weekly review.',
        'urgent',
        NOW() + INTERVAL '3 days',
        FALSE,
        1,
        2
    ),
    (
        'Verify the stationery, printer paper, and desk materials for tomorrow.',
        'normal',
        NOW() + INTERVAL '5 days',
        TRUE,
        1,
        4
    );

INSERT INTO bgss_todo.task_assignments (task_id, user_id, assigned_by)
VALUES
    (1, 2, 1),
    (1, 3, 1),
    (2, 4, 1);

COMMIT;
