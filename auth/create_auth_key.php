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
$description = $data['description'] ?? '';

try {
    // Генерируем уникальный код авторизации
    function generateUniqueCode($length = 8) {
        $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $code = '';
        for ($i = 0; $i < $length; $i++) {
            $code .= $characters[rand(0, strlen($characters) - 1)];
        }
        return $code;
    }

    // Проверяем уникальность кода
    do {
        $code = generateUniqueCode();
        $stmt = $pdo->prepare("SELECT id FROM auth_codes WHERE code = ?");
        $stmt->execute([$code]);
    } while ($stmt->fetch());

    // Создаем новый код авторизации
    $stmt = $pdo->prepare("
        INSERT INTO auth_codes (code, description, created_by)
        VALUES (?, ?, ?)
    ");
    
    $stmt->execute([
        $code,
        $description,
        $_SESSION['admin_id']
    ]);
    
    echo json_encode([
        'success' => true,
        'code' => $code
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
} 