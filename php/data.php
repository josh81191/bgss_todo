<?php

require_once __DIR__ . '/db.php';

$schema = bgss_db_config()['schema'] ?? '';

function bgss_normalize_user($row)
{
    return [
        'id'       => (string) ($row['id'] ?? ''),
        'name'     => (string) ($row['name'] ?? ''),
        'username' => (string) ($row['username'] ?? ''),
        'password' => (string) ($row['password'] ?? ($row['password_hash'] ?? '')),
        'role'     => (string) ($row['role'] ?? 'staff'),
    ];
}

function bgss_fetch_users()
{
    $pdo = bgss_db_connect();
    if (! $pdo) {
        return [];
    }

    $stmt = $pdo->query('SELECT id, name, username, password, role FROM ' . $GLOBALS['schema'] . '.users ORDER BY name ASC');
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getUsers()
{
    $rows = bgss_fetch_users();
    return array_map('bgss_normalize_user', $rows);
}

function bgss_normalize_project($row)
{
    return [
        'id'   => (string) ($row['id'] ?? ''),
        'name' => (string) ($row['name'] ?? ''),
        'slug' => (string) ($row['slug'] ?? ''),
    ];
}

function getProjects()
{
    $pdo = bgss_db_connect();
    if (! $pdo) {
        return [];
    }

    $stmt = $pdo->query('SELECT id, name, slug FROM ' . $GLOBALS['schema'] . '.projects ORDER BY name ASC');
    return array_map('bgss_normalize_project', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function projectById($projectId)
{
    $pdo = bgss_db_connect();
    if (! $pdo) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id, name, slug FROM ' . $GLOBALS['schema'] . '.projects WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $projectId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ? bgss_normalize_project($row) : null;
}

function defaultProjectId()
{
    $pdo = bgss_db_connect();
    if (! $pdo) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id FROM ' . $GLOBALS['schema'] . '.projects WHERE slug = :slug LIMIT 1');
    $stmt->execute([':slug' => 'mineco']);
    $id = $stmt->fetchColumn();

    return $id !== false ? (string) $id : null;
}

function userById($userId)
{
    $pdo = bgss_db_connect();
    if (! $pdo) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id, name, username, password, role FROM ' . $GLOBALS['schema'] . '.users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (! $row) {
        return null;
    }

    return bgss_normalize_user($row);
}

function findUserByCredentials($username, $password)
{
    $username = trim((string) $username);
    $password = trim((string) $password);

    if ($username === '' || $password === '') {
        return null;
    }

    $pdo = bgss_db_connect();
    if (! $pdo) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id, name, username, password, role FROM ' . $GLOBALS['schema'] . '.users WHERE LOWER(username) = LOWER(:username) LIMIT 1');
    $stmt->execute([':username' => $username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (! $row) {
        return null;
    }

    $storedPassword = (string) ($row['password'] ?? '');

    if ($storedPassword !== '' && hash_equals($storedPassword, $password)) {
        return bgss_normalize_user($row);
    }

    return null;
}

function bgss_normalize_task($row)
{
    return [
        'id'          => (string) ($row['id'] ?? ''),
        'description' => (string) ($row['description'] ?? ''),
        'comment'     => (string) ($row['comment'] ?? ''),
        'photo_url'   => (string) ($row['photo_url'] ?? ''),
        'photo_path'  => (string) ($row['photo_path'] ?? ''),
        'priority'    => (string) ($row['priority'] ?? 'normal'),
        'deadline'    => $row['deadline'] ? (string) $row['deadline'] : '',
        'completed'   => (bool) ($row['completed'] ?? false),
        'created_by'  => (string) ($row['created_by'] ?? ''),
        'assigned_to' => ($row['assigned_to'] ?? null) !== null ? [(string) $row['assigned_to']] : [],
        'project_id'  => (string) ($row['project_id'] ?? ''),
        'created_at'  => (string) ($row['created_at'] ?? ''),
    ];
}

function getTasks()
{
    $pdo = bgss_db_connect();
    if (! $pdo) {
        return [];
    }

    $stmt = $pdo->query('SELECT id, description, comment, photo_url, photo_path, priority, deadline, completed, created_by, assigned_to, project_id, created_at FROM ' . $GLOBALS['schema'] . '.tasks ORDER BY completed ASC, CASE WHEN priority = \'urgent\' THEN 0 ELSE 1 END, created_at DESC');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return array_map('bgss_normalize_task', $rows);
}

function getTaskById($taskId)
{
    $pdo = bgss_db_connect();
    if (! $pdo) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id, description, comment, photo_url, photo_path, priority, deadline, completed, created_by, assigned_to, project_id, created_at FROM ' . $GLOBALS['schema'] . '.tasks WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $taskId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ? bgss_normalize_task($row) : null;
}

function jsonResponse($payload, $statusCode = 200)
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}
