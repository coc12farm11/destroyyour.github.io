<?php
session_start();
require_once '../config/database.php';

// Проверяем авторизацию админа
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

try {
    // Сначала удаляем все связанные сессии
    $stmt = $pdo->prepare("
        DELETE FROM auth_sessions 
        WHERE auth_code_id = ?
    ");
    $stmt->execute([$id]);

    // Затем удаляем сам ключ
    $stmt = $pdo->prepare("
        DELETE FROM auth_codes 
        WHERE id = ?
    ");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
} 