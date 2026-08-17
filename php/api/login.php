<?php
session_start();
require __DIR__ . '/data.php';

$rawInput = file_get_contents('php://input');
$data     = json_decode($rawInput, true);

if (! is_array($data)) {
    $data = $_POST;
}

$username = trim((string) ($data['username'] ?? ''));
$password = trim((string) ($data['password'] ?? ''));

if ($username === '' || $password === '') {
    jsonResponse(['success' => false, 'error' => 'Username and password are required.'], 400);
}

$user = findUserByCredentials($username, $password);

if (! $user) {
    jsonResponse(['success' => false, 'error' => 'Invalid username or password.'], 401);
}

$_SESSION['bgss_user'] = [
    'id'       => $user['id'],
    'name'     => $user['name'],
    'username' => $user['username'],
    'role'     => $user['role'],
];

jsonResponse([
    'success' => true,
    'user'    => $_SESSION['bgss_user'],
]);
