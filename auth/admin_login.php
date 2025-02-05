<?php
session_start();
require_once '../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

try {
    $stmt = $pdo->prepare("SELECT id, password_hash FROM admin_users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    // Добавляем отладочную информацию
    error_log('Login attempt - Username: ' . $username);
    error_log('User found: ' . ($user ? 'Yes' : 'No'));
    if ($user) {
        error_log('Password verification result: ' . (password_verify($password, $user['password_hash']) ? 'True' : 'False'));
    }

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['admin_id'] = $user['id'];
        echo json_encode(['success' => true]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Неверный логин или пароль'
        ]);
    }
} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка сервера: ' . $e->getMessage()
    ]);
} 