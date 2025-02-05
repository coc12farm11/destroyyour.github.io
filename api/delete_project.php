<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
$projectId = $data['projectId'] ?? null;

if (!$projectId) {
    echo json_encode(['success' => false, 'message' => 'Project ID is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM projects WHERE id = :id");
    $stmt->execute(['id' => $projectId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Project deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Project not found or already deleted']);
    }
} catch (PDOException $e) {
    error_log("Error in delete_project.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to delete project: ' . $e->getMessage()]);
}