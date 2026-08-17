# Todo System - Tailored for BGSS (Buannel Geo Solutions & Services)

A lightweight, role-aware task management dashboard built with PHP, PostgreSQL, vanilla JavaScript, and CSS. Tasks are organized by project, assigned to a single person, and can carry a comment, a photo attachment, a deadline, and a priority.

## Features

### Authentication & roles

- Session-based login (`php/login.php` / `php/logout.php`).
- Two roles: `manager` and `staff`.
- Managers have full control over every task, every project, and every user.
- Staff ("non-managers") only see tasks assigned to them or created by them, from any project.

### Tasks

- Inline task creation directly from the table (type and press Enter, or click away).
- Single-person assignment per task.
- Normal and urgent priority, toggled with a flag icon or dropdown.
- Inline deadline picker per task, plus a "remove deadline" action in the details dialog.
- Task details dialog: assigned-to, priority, creator, created date, deadline, a 200-character comment box, and a photo attachment (uploaded to Firebase Storage, compressed client-side before upload).
- Mark a task complete, and managers can revert a completed task back to active from the same button (icon/label swap to "Revert to active").
- Manager-only task deletion, with photo cleanup in Firebase Storage.
- Active / Completed task view toggle (managers only).
- Manager-only filters: filter the task list and the task/urgent summary counts by project and by assigned person.
- Automatic polling refresh every 20 seconds, paused while a field is actively being edited; a manual refresh button also scrolls the page back to the top.

### Permissions summary

| Action                                       |        Manager        | Staff (creator of the task) | Staff (assigned, not creator) |
| -------------------------------------------- | :-------------------: | :-------------------------: | :---------------------------: |
| View task                                    |          All          |             Yes             |              Yes              |
| Edit description                             |          Yes          |             Yes             |              No               |
| Change priority (urgent/normal)              |          Yes          |             Yes             |              No               |
| Reassign task                                |          Yes          |             Yes             |              No               |
| Change/remove deadline                       |          Yes          |             Yes             |              No               |
| Add/edit comment                             |          Yes          |             Yes             |              Yes              |
| Upload/remove photo                          |          Yes          |             Yes             |              Yes              |
| Mark complete / revert to active             | Yes (both directions) |  Yes (mark complete only)   |   Yes (mark complete only)    |
| Delete task                                  |          Yes          |             No              |              No               |
| Project / assignee filters, task-view toggle |          Yes          |          Not shown          |           Not shown           |

## Requirements

- PHP 8.0 or newer
- PostgreSQL 12 or newer
- Apache, such as XAMPP
- A modern desktop or mobile browser
- A Firebase project with Storage enabled (only required for task photo uploads)

## Installation

1. Copy the project into the XAMPP web root:

   ```text
   C:\xampp\htdocs\bgss_todo
   ```

2. Start Apache from the XAMPP Control Panel.

3. Start PostgreSQL and create a database for the application.

4. Create the database configuration file from the example:

   ```text
   php/db_config_example.php -> php/db_config.php
   ```

5. Edit `php/db_config.php` with your PostgreSQL connection details:

   ```php
   return [
       'host'     => 'localhost',
       'port'     => '5432',
       'database' => 'your_database_name',
       'username' => 'your_db_user',
       'password' => 'your_db_password',
       'schema'   => 'bgss_todo',
       'sslmode'  => 'prefer',
   ];
   ```

6. Configure Firebase Storage for task photos:

   ```text
   js/firebase-config.example.js -> js/firebase-config.js
   ```

   Replace the placeholder values in `js/firebase-config.js` with your Firebase web app configuration. Create a Firebase Storage bucket and configure Storage Security Rules to allow the intended authenticated users to upload, read, replace, and delete task photos. The browser Firebase configuration is not a server secret; your Storage Rules protect the files.

7. Run the SQL migrations in order:

   ```text
   db/migrations/001_init_schema.sql
   db/migrations/002_update_plaintext_passwords_and_remove_updated_at.sql
   db/migrations/003_remove_task_title.sql
   db/migrations/004_add_comment_remove_task_seen.sql
   db/migrations/005_single_task_assignment.sql
   db/migrations/006_add_task_photo.sql
   db/migrations/007_add_projects.sql
   ```

8. Load seed data if this is a development/demo database (pick one):

   ```text
   db/seed/001_init_seed.sql            Minimal legacy seed
   db/seed/002_final_seed_for_demo.sql  Fuller demo dataset (resets users/projects/tasks)
   ```

   `002_final_seed_for_demo.sql` truncates `bgss_todo.users`, `bgss_todo.projects`, and `bgss_todo.tasks` before inserting, so only run it against a database you're happy to reset. It creates one manager, four staff accounts, three projects, and a mix of manager-created and staff-created tasks (covering urgent/normal, completed/active, and creator-vs-assignee ownership) so every permission path in the app has example data.

9. Open the application:

   ```text
   http://localhost/bgss_todo
   ```

## Demo accounts

After running `002_final_seed_for_demo.sql`, the following accounts are available (password `123` for all):

| Username | Role    |
| -------- | ------- |
| manager  | manager |
| aye      | staff   |
| nang     | staff   |
| zomi     | staff   |
| htet     | staff   |

## Database Notes

The current schema uses:

- `bgss_todo.users` — login accounts, `name`, `username`, plaintext `password` (development only), and `role` (`manager` or `staff`).
- `bgss_todo.projects` — `name` and unique `slug`; tasks belong to exactly one project.
- `bgss_todo.tasks` — `description`, `comment`, `photo_url`/`photo_path`, `priority`, `deadline`, `completed`, `created_by`, a single `assigned_to`, and `project_id`.

Migration history:

- `001_init_schema.sql` — initial schema (users, tasks, task_assignments).
- `002_update_plaintext_passwords_and_remove_updated_at.sql` — renames `password_hash` to `password` and drops `updated_at` columns.
- `003_remove_task_title.sql` — drops the unused `title` column from tasks.
- `004_add_comment_remove_task_seen.sql` — adds `comment`, drops the old `task_seen` table.
- `005_single_task_assignment.sql` — moves each task's first assignment into `tasks.assigned_to` and drops `task_assignments`.
- `006_add_task_photo.sql` — adds `photo_url` and `photo_path` for Firebase Storage attachments.
- `007_add_projects.sql` — adds `bgss_todo.projects` and `tasks.project_id`, backfilling existing tasks under the default project.

## API

`php/tasks.php` is a session-authenticated JSON endpoint used by `js/app.js`.

- `GET` — returns the current user's visible tasks, all users, and all projects.
- `POST` with `action` in the request body:
  - `create_task`, `update_task` (description), `update_comment`, `update_photo`, `update_priority`, `update_assigned`, `update_deadline`, `toggle_complete`, `delete_task`.

Every write action re-checks the current session user's role and task ownership server-side (manager, task creator, or assignee, depending on the action) — the frontend only hides/disables controls for convenience, it does not enforce permissions on its own.

## Development

The frontend uses plain JavaScript and CSS. There is no Node.js build step.

Useful checks:

```powershell
node --check js/app.js
php -l dashboard.php
php -l php/data.php
php -l php/tasks.php
```

The PHP checks require PHP to be available on the command line. When using XAMPP, PHP can also be run directly from the XAMPP installation directory.

## Project Structure

```text
dashboard.php                   Authenticated task dashboard
index.php                       Login page
style.css                       Dashboard styles
style_login.css                 Login styles
js/app.js                       Task loading, rendering, filters, and interactions
js/firebase-config.example.js   Firebase web config template
php/data.php                    User, project, and task data access
php/tasks.php                   Task API endpoint (list + all task actions)
php/login.php                   Login endpoint
php/logout.php                  Logout endpoint
php/db.php                      PDO connection helper
php/db_config_example.php       Database configuration template
db/migrations/                  Ordered database migrations
db/seed/                        Development/demo seed data
assets/images/                  Images and branding assets
```

## Security Notes

- Do not commit `php/db_config.php`, `js/firebase-config.js`, or any real credentials.
- Passwords are stored in plaintext in this schema; this is intended for a small trusted internal tool, not a public deployment. Use strong, non-reused passwords, and restrict access at the network/Apache level if exposed beyond localhost.
- All permission checks (view, edit, reassign, complete, delete) are enforced in `php/tasks.php`, not just in the UI. Do not rely on hiding a button as the only safeguard when adding new features.
- Review session, database, and Apache configuration before deploying publicly.
