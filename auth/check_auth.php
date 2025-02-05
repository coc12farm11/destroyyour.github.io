<?php
session_start();
require_once '../config/database.php';

// Включаем отладочную информацию
error_log('Request received: ' . file_get_contents('php://input'));
error_log('Current session: ' . print_r($_SESSION, true));

$data = json_decode(file_get_contents('php://input'), true);
$fingerprint = $data['fingerprint'] ?? '';
$authKey = $data['auth_key'] ?? '';

try {
    if ($authKey) {
        // Проверяем код авторизации
        $stmt = $pdo->prepare("
            SELECT auth_codes.id 
            FROM auth_codes
            WHERE auth_codes.code = ? AND auth_codes.is_active = TRUE
        ");
        $stmt->execute([$authKey]);
        $code = $stmt->fetch();

        if ($code) {
            // Проверяем существующую сессию для этого fingerprint
            $stmt = $pdo->prepare("
                SELECT id FROM auth_sessions 
                WHERE fingerprint = ?
            ");
            $stmt->execute([$fingerprint]);
            $existingSession = $stmt->fetch();

            if ($existingSession) {
                // Обновляем существующую сессию
                $stmt = $pdo->prepare("
                    UPDATE auth_sessions 
                    SET auth_code_id = ?, last_active = CURRENT_TIMESTAMP 
                    WHERE fingerprint = ?
                ");
                $stmt->execute([$code['id'], $fingerprint]);
            } else {
                // Создаем новую сессию
                $stmt = $pdo->prepare("
                    INSERT INTO auth_sessions (auth_code_id, fingerprint)
                    VALUES (?, ?)
                ");
                $stmt->execute([$code['id'], $fingerprint]);
            }
            
            // Сохраняем в PHP сессии информацию об авторизации
            $_SESSION['user_fingerprint'] = $fingerprint;
            $_SESSION['auth_code_id'] = $code['id'];
            
            error_log('Auth successful. Session data: ' . print_r($_SESSION, true));
            
            echo json_encode(['success' => true]);
            exit;
        }
        
        echo json_encode([
            'success' => false,
            'message' => 'Неверный код авторизации'
        ]);
        exit;
    }

    // Проверяем существующую сессию
    if (isset($_SESSION['user_fingerprint']) && $_SESSION['user_fingerprint'] === $fingerprint) {
        // Если есть активная PHP сессия, проверяем актуальность в базе
        $stmt = $pdo->prepare("
            SELECT sessions.id 
            FROM auth_sessions sessions
            JOIN auth_codes ac ON sessions.auth_code_id = ac.id
            WHERE sessions.fingerprint = ? AND ac.is_active = TRUE
            AND sessions.last_active > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ");
        $stmt->execute([$fingerprint]);
        
        if ($stmt->fetch()) {
            error_log('Session check successful');
            // Обновляем время последней активности
            $pdo->prepare("
                UPDATE auth_sessions 
                SET last_active = CURRENT_TIMESTAMP 
                WHERE fingerprint = ?
            ")->execute([$fingerprint]);
            
            echo json_encode(['authenticated' => true]);
            exit;
        }
    }

    error_log('Auth failed. Clearing session.');
    // Если сессия не найдена или устарела, очищаем PHP сессию
    unset($_SESSION['user_fingerprint']);
    unset($_SESSION['auth_code_id']);
    echo json_encode(['authenticated' => false]);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка сервера'
    ]);
} 