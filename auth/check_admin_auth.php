<?php
session_start();
require_once '../config/database.php';

try {
    // Проверяем наличие ID админа в сессии
    if (!isset($_SESSION['admin_id'])) {
        echo json_encode(['authenticated' => false]);
        exit;
    }

    // Проверяем существование админа в базе
    $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE id = ?");
    $stmt->execute([$_SESSION['admin_id']]);
    
    if ($stmt->fetch()) {
        echo json_encode(['authenticated' => true]);
    } else {
        // Если админ не найден, очищаем сессию
        unset($_SESSION['admin_id']);
        echo json_encode(['authenticated' => false]);
    }
} catch (PDOException $e) {
    echo json_encode([
        'authenticated' => false,
        'error' => 'Database error'
    ]);
} 