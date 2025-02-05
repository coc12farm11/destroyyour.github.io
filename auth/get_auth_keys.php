<?php
session_start();
require_once '../config/database.php';

// Проверяем авторизацию админа
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    // Получаем все ключи авторизации
    $stmt = $pdo->prepare("
        SELECT 
            ac.id,
            ac.code,
            ac.description,
            ac.is_active,
            ac.created_at,
            au.username as created_by
        FROM auth_codes ac
        LEFT JOIN admin_users au ON ac.created_by = au.id
        ORDER BY ac.created_at DESC
    ");
    
    $stmt->execute();
    $keys = $stmt->fetchAll();
    
    echo json_encode($keys);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
} 