<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

try {
    if (!isset($_GET['wallet'])) {
        throw new Exception('Wallet parameter is required');
    }
    
    $wallet = $_GET['wallet'];
    
    // Получаем транзакции
    $stmt = $pdo->prepare("
        SELECT 
            t.*,
            tok.symbol as token_symbol
        FROM transactions t
        JOIN wallets w ON t.wallet_id = w.id
        LEFT JOIN tokens tok ON t.token_id = tok.id
        WHERE w.public_key = ?
        ORDER BY t.created_at DESC
    ");
    
    $stmt->execute([$wallet]);
    $transactions = $stmt->fetchAll();
    
    // Считаем статистику
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total,
            COALESCE(SUM(CASE WHEN type = 'BUY' THEN amount ELSE -amount END), 0) as volume
        FROM transactions t
        JOIN wallets w ON t.wallet_id = w.id
        WHERE w.public_key = ?
    ");
    
    $stmt->execute([$wallet]);
    $stats = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'transactions' => $transactions,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 