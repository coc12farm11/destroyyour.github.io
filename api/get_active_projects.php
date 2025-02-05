<?php
// api/get_active_projects.php

header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

try {
    if (!$pdo) {
        throw new Exception('Database connection not available');
    }

    $stmt = $pdo->query("SELECT id, name, token_id FROM projects WHERE is_active = 1 ORDER BY created_at DESC");
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'projects' => $projects
    ]);
} catch (Exception $e) {
    error_log("Error in get_active_projects.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load active projects: ' . $e->getMessage()
    ]);
}