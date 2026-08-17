<?php

function bgss_db_config()
{
    // use db_config_dev.php for development environment, db_config.php for production

    // $configFile = __DIR__ . '/db_config.php';
    $configFile = __DIR__ . '/db_config_dev.php';

    if (file_exists($configFile)) {
        $config = require $configFile;
        return is_array($config) ? $config : [];
    }

    return [];
}

function bgss_db_connect()
{
    $config = bgss_db_config();

    $host     = trim((string) ($config['host'] ?? ''));
    $port     = trim((string) ($config['port'] ?? ''));
    $database = trim((string) ($config['database'] ?? ''));
    $username = trim((string) ($config['username'] ?? ''));
    $password = trim((string) ($config['password'] ?? ''));
    $schema   = trim((string) ($config['schema'] ?? ''));
    $sslmode  = trim((string) ($config['sslmode'] ?? 'prefer'));

    if ($host === '' || $database === '' || $username === '') {
        return null;
    }

    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s;user=%s;password=%s;sslmode=%s',
        $host,
        $port,
        $database,
        $username,
        $password,
        $sslmode
    );

    try {
        $pdo = new PDO($dsn);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->query('SET search_path TO ' . $schema);
        return $pdo;
    } catch (Throwable $e) {
        error_log('BGSS DB connection failed: ' . $e->getMessage());
        return null;
    }
}

function bgss_db_is_ready()
{
    return bgss_db_connect() !== null;
}
