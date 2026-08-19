<?php
session_start();
require __DIR__ . '/../core/data.php';

if (! isset($_SESSION['bgss_user'])) {
    jsonResponse(['success' => false, 'error' => 'Unauthorized'], 401);
}

$currentUser = $_SESSION['bgss_user'];
$pdo         = bgss_db_connect();

if (! $pdo) {
    jsonResponse(['success' => false, 'error' => 'Database connection not available.'], 503);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Builds the same role-scoped, enriched task list for both GET polling and POST action responses.
function bgss_visible_tasks($currentUser)
{
    $tasks = getTasks();

    if ($currentUser['role'] !== 'manager') {
        $tasks = array_values(array_filter($tasks, function ($task) use ($currentUser) {
            return in_array($currentUser['id'], $task['assigned_to'] ?? [], true)
            || (string) ($task['created_by'] ?? '') === (string) $currentUser['id'];
        }));
    }

    return $tasks;
}

// A non-manager may act on a task if they're assigned to it or created it; managers can act on any task.
function bgss_can_manage_task($currentUser, $task)
{
    if ($currentUser['role'] === 'manager') {
        return true;
    }

    return in_array($currentUser['id'], $task['assigned_to'] ?? [], true)
    || (string) ($task['created_by'] ?? '') === (string) $currentUser['id'];
}

if ($method === 'GET') {
    jsonResponse(['success' => true, 'tasks' => bgss_visible_tasks($currentUser), 'current_user' => $currentUser, 'projects' => getProjects()]);
}

if ($method !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Unsupported method.'], 405);
}

$rawInput = file_get_contents('php://input');
$data     = json_decode($rawInput, true);

if (! is_array($data)) {
    jsonResponse(['success' => false, 'error' => 'Invalid request body.'], 400);
}

$action = (string) ($data['action'] ?? '');

if ($action === 'update_task') {
    $taskId = trim((string) ($data['task_id'] ?? ''));
    $task   = getTaskById($taskId);

    if (! $task) {
        jsonResponse(['success' => false, 'error' => 'Task not found.'], 404);
    }

    $isOwner = $currentUser['role'] === 'manager' || $task['created_by'] === (string) $currentUser['id'];
    if (! $isOwner) {
        jsonResponse(['success' => false, 'error' => 'You can only edit tasks you created.'], 403);
    }

    $description = trim((string) ($data['description'] ?? ''));
    $comment     = trim((string) ($data['comment'] ?? ''));

    if ($description === '') {
        jsonResponse(['success' => false, 'error' => 'Task is required.'], 400);
    }

    $update = $pdo->prepare('UPDATE bgss_todo.tasks SET description = :description, comment = :comment WHERE id = :task_id');
    $update->execute([
        ':description' => $description,
        ':comment'     => $comment,
        ':task_id'     => $taskId,
    ]);
    jsonResponse(['success' => true, 'tasks' => bgss_visible_tasks($currentUser)]);
}

if ($action === 'update_comment') {
    $taskId = trim((string) ($data['task_id'] ?? ''));
    $task   = getTaskById($taskId);

    if (! $task) {
        jsonResponse(['success' => false, 'error' => 'Task not found.'], 404);
    }

    if (! bgss_can_manage_task($currentUser, $task)) {
        jsonResponse(['success' => false, 'error' => 'You are not allowed to update this task.'], 403);
    }

    $comment = trim((string) ($data['comment'] ?? ''));
    if (strlen($comment) > 200) {
        jsonResponse(['success' => false, 'error' => 'Comment must be 200 characters or fewer.'], 400);
    }

    $update = $pdo->prepare('UPDATE bgss_todo.tasks SET comment = :comment WHERE id = :task_id');
    $update->execute([':comment' => $comment, ':task_id' => $taskId]);
    jsonResponse(['success' => true, 'tasks' => bgss_visible_tasks($currentUser)]);
}

if ($action === 'update_photo') {
    $taskId = trim((string) ($data['task_id'] ?? ''));
    $task   = getTaskById($taskId);

    if (! $task) {
        jsonResponse(['success' => false, 'error' => 'Task not found.'], 404);
    }

    if (! bgss_can_manage_task($currentUser, $task)) {
        jsonResponse(['success' => false, 'error' => 'You are not allowed to update this task.'], 403);
    }

    $photoUrl  = trim((string) ($data['photo_url'] ?? ''));
    $photoPath = trim((string) ($data['photo_path'] ?? ''));
    $update    = $pdo->prepare('UPDATE bgss_todo.tasks SET photo_url = :photo_url, photo_path = :photo_path WHERE id = :task_id');
    $update->execute([
        ':photo_url'  => $photoUrl,
        ':photo_path' => $photoPath,
        ':task_id'    => $taskId,
    ]);
    jsonResponse(['success' => true, 'tasks' => bgss_visible_tasks($currentUser)]);
}

if ($action === 'toggle_complete') {
    $taskId = (string) ($data['task_id'] ?? '');
    $task   = getTaskById($taskId);

    if (! $task) {
        jsonResponse(['success' => false, 'error' => 'Task not found.'], 404);
    }

    if (! bgss_can_manage_task($currentUser, $task)) {
        jsonResponse(['success' => false, 'error' => 'You are not allowed to update this task.'], 403);
    }

    $update = $pdo->prepare('UPDATE bgss_todo.tasks SET completed = NOT completed, completed_at = CASE WHEN completed THEN NULL ELSE NOW() END WHERE id = :task_id');
    $update->execute([':task_id' => $taskId]);
    jsonResponse(['success' => true, 'tasks' => bgss_visible_tasks($currentUser)]);
}

if ($action === 'update_priority') {
    $taskId = (string) ($data['task_id'] ?? '');
    $task   = getTaskById($taskId);

    if (! $task) {
        jsonResponse(['success' => false, 'error' => 'Task not found.'], 404);
    }

    $isOwner = $currentUser['role'] === 'manager' || $task['created_by'] === (string) $currentUser['id'];
    if (! $isOwner) {
        jsonResponse(['success' => false, 'error' => 'You can only change priority on tasks you created.'], 403);
    }

    $priority = in_array(($data['priority'] ?? 'normal'), ['urgent', 'normal'], true) ? ($data['priority'] ?? 'normal') : 'normal';

    $update = $pdo->prepare('UPDATE bgss_todo.tasks SET priority = :priority WHERE id = :task_id');
    $update->execute([':priority' => $priority, ':task_id' => $taskId]);
    jsonResponse(['success' => true, 'tasks' => bgss_visible_tasks($currentUser)]);
}

if ($action === 'update_deadline') {
    $taskId = (string) ($data['task_id'] ?? '');
    $task   = getTaskById($taskId);

    if (! $task) {
        jsonResponse(['success' => false, 'error' => 'Task not found.'], 404);
    }

    $isOwner = $currentUser['role'] === 'manager' || $task['created_by'] === (string) $currentUser['id'];
    if (! $isOwner) {
        jsonResponse(['success' => false, 'error' => 'You can only change the deadline on tasks you created.'], 403);
    }

    $deadline = trim((string) ($data['deadline'] ?? ''));

    $update = $pdo->prepare('UPDATE bgss_todo.tasks SET deadline = :deadline WHERE id = :task_id');
    $update->execute([
        ':deadline' => $deadline !== '' ? $deadline : null,
        ':task_id'  => $taskId,
    ]);
    jsonResponse(['success' => true, 'tasks' => bgss_visible_tasks($currentUser)]);
}

if ($action === 'update_assigned') {
    $taskId = (string) ($data['task_id'] ?? '');
    $task   = getTaskById($taskId);

    if (! $task) {
        jsonResponse(['success' => false, 'error' => 'Task not found.'], 404);
    }

    $isOwner = $currentUser['role'] === 'manager' || $task['created_by'] === (string) $currentUser['id'];
    if (! $isOwner) {
        jsonResponse(['success' => false, 'error' => 'You can only reassign tasks you created.'], 403);
    }

    $assigned = array_values(array_unique(array_filter(array_map('trim', (array) ($data['assigned_to'] ?? [])))));

    $assignedTo = $currentUser['role'] === 'manager' ? ($assigned[0] ?? null) : null;
    if ($assignedTo !== null && ! userById($assignedTo)) {
        jsonResponse(['success' => false, 'error' => 'A valid assignee is required.'], 400);
    }
    $update = $pdo->prepare('UPDATE bgss_todo.tasks SET assigned_to = :assigned_to WHERE id = :task_id');
    $update->execute([':assigned_to' => $assignedTo, ':task_id' => $taskId]);

    jsonResponse(['success' => true, 'tasks' => bgss_visible_tasks($currentUser)]);
}

if ($action === 'create_task') {
    $description = trim((string) ($data['description'] ?? ''));
    $comment     = trim((string) ($data['comment'] ?? ''));
    $priority    = in_array(($data['priority'] ?? 'normal'), ['urgent', 'normal'], true) ? ($data['priority'] ?? 'normal') : 'normal';
    $deadline    = trim((string) ($data['deadline'] ?? ''));
    $assigned    = array_values(array_unique(array_filter(array_map('trim', (array) ($data['assigned_to'] ?? [])))));

    if ($description === '') {
        jsonResponse(['success' => false, 'error' => 'Description is required.'], 400);
    }

    $assignedTo = $currentUser['role'] === 'manager' ? ($assigned[0] ?? null) : null;
    if ($assignedTo !== null && ! userById($assignedTo)) {
        jsonResponse(['success' => false, 'error' => 'A valid assignee is required.'], 400);
    }

    $projectId = trim((string) ($data['project_id'] ?? ''));
    if ($currentUser['role'] !== 'manager' || $projectId === '' || ! projectById($projectId)) {
        $projectId = defaultProjectId();
    }
    if (! $projectId) {
        jsonResponse(['success' => false, 'error' => 'No project is available for this task.'], 400);
    }

    $insertTask = $pdo->prepare('INSERT INTO bgss_todo.tasks (description, comment, priority, deadline, completed, created_by, assigned_to, project_id, created_at) VALUES (:description, :comment, :priority, :deadline, false, :created_by, :assigned_to, :project_id, NOW()) RETURNING id');
    $insertTask->execute([
        ':description' => $description,
        ':comment'     => $comment,
        ':priority'    => $priority,
        ':deadline'    => $deadline !== '' ? $deadline : null,
        ':created_by'  => $currentUser['id'],
        ':assigned_to' => $assignedTo,
        ':project_id'  => $projectId,
    ]);
    $taskId = $insertTask->fetchColumn();

    jsonResponse(['success' => true, 'tasks' => bgss_visible_tasks($currentUser)]);
}

if ($action === 'delete_task') {
    if ($currentUser['role'] !== 'manager') {
        jsonResponse(['success' => false, 'error' => 'Only managers can delete tasks.'], 403);
    }

    $taskId     = trim((string) ($data['task_id'] ?? ''));
    $deleteStmt = $pdo->prepare('DELETE FROM bgss_todo.tasks WHERE id = :task_id');
    $deleteStmt->execute([':task_id' => $taskId]);
    jsonResponse(['success' => true, 'tasks' => bgss_visible_tasks($currentUser)]);
}

jsonResponse(['success' => false, 'error' => 'Unsupported action.'], 400);
