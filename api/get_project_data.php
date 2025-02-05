<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

$projectId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($projectId === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid project ID']);
    exit;
}

try {
    if (!$pdo) {
        throw new Exception('Database connection not available');
    }

    $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?");
    $stmt->execute([$projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        throw new Exception('Project not found');
    }

    echo json_encode([
        'success' => true,
        'project' => $project
    ]);
} catch (Exception $e) {
    error_log("Error in get_project_data.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load project data: ' . $e->getMessage()
    ]);
}