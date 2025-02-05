<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

try {
    if (!$pdo) {
        throw new Exception('Database connection not available');
    }

    error_log("Executing wallet query");
    
    $stmt = $pdo->query("SELECT id, public_key FROM wallets ORDER BY created_at DESC");
    if (!$stmt) {
        throw new Exception('Failed to execute query');
    }

    $wallets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Found " . count($wallets) . " wallets");

    echo json_encode([
        'success' => true,
        'wallets' => $wallets,
        'count' => count($wallets)
    ]);
} catch (Exception $e) {
    error_log("Error in get_wallets.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load wallets: ' . $e->getMessage()
    ]);
} 