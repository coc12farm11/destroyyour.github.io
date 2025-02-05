<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

try {
    // Проверяем подключение к БД
    if (!$pdo) {
        throw new Exception('Database connection not available');
    }

    // Добавляем логирование запроса
    error_log("Executing token query");
    
    $stmt = $pdo->query("SELECT id, name, symbol FROM tokens ORDER BY created_at DESC");
    if (!$stmt) {
        throw new Exception('Failed to execute query');
    }

    $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Found " . count($tokens) . " tokens");

    echo json_encode([
        'success' => true,
        'tokens' => $tokens,
        'count' => count($tokens)
    ]);
} catch (Exception $e) {
    error_log("Error in get_tokens.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load tokens: ' . $e->getMessage()
    ]);
}