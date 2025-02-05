<?php
// Отключаем вывод ошибок в HTML
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Устанавливаем заголовки
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Определяем корневую директорию проекта
define('ROOT_DIR', dirname(__DIR__));

// Логирование ошибок в файл
function logError($message) {
    $logDir = ROOT_DIR . '/logs';
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    error_log(date('[Y-m-d H:i:s] ') . $message . PHP_EOL, 3, $logDir . '/wallet_errors.log');
}

try {
    require_once ROOT_DIR . '/config/database.php';
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    $input = file_get_contents('php://input');
    if (!$input) {
        throw new Exception('No input data received');
    }

    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    if (!isset($data['wallets']) || !is_array($data['wallets'])) {
        throw new Exception('Invalid data format: wallets array required');
    }

    // Проверяем существование таблицы
    try {
        $pdo->query("SELECT 1 FROM wallets LIMIT 1");
    } catch (PDOException $e) {
        // Если таблица не существует, создаем её
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS wallets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                secret_key TEXT NOT NULL,
                public_key VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_public_key (public_key)
            )
        ");
    }

    $stmt = $pdo->prepare("INSERT INTO wallets (secret_key, public_key, created_at) VALUES (?, ?, NOW())");
    
    $successCount = 0;
    $errors = [];
    
    foreach ($data['wallets'] as $wallet) {
        if (!isset($wallet['secretKey']) || !isset($wallet['publicKey'])) {
            $errors[] = 'Invalid wallet data format';
            continue;
        }
        
        try {
            $stmt->execute([
                $wallet['secretKey'],
                $wallet['publicKey']
            ]);
            $successCount++;
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Duplicate entry
                $errors[] = "Wallet already exists: {$wallet['publicKey']}";
            } else {
                $errors[] = "Failed to add wallet: {$wallet['publicKey']}";
                logError("Database error: " . $e->getMessage());
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Successfully added {$successCount} wallets" . 
                    (count($errors) > 0 ? " with " . count($errors) . " errors" : ""),
        'errors' => $errors
    ]);

} catch (Exception $e) {
    logError($e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
} 