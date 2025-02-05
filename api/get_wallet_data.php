<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

$walletId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($walletId === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid project ID']);
    exit;
}

try {
    if (!$pdo) {
        throw new Exception('Database connection not available');
    }

    $stmt = $pdo->prepare("SELECT * FROM wallets WHERE id = ?");
    $stmt->execute([$walletId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        throw new Exception('Wallet not found');
    }

    echo json_encode([
        'success' => true,
        'project' => $project
    ]);
} catch (Exception $e) {
    error_log("Error in get_wallet_data.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load wallet data: ' . $e->getMessage()
    ]);
}