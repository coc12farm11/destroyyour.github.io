<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

try {
    if (!isset($_GET['id'])) {
        throw new Exception('Token ID is required');
    }

    $tokenId = $_GET['id'];

    if (!$pdo) {
        throw new Exception('Database connection not available');
    }

    error_log("Executing token info query for ID: $tokenId");
    
    $stmt = $pdo->prepare("SELECT * FROM tokens WHERE id = ?");
    $stmt->execute([$tokenId]);

    if (!$stmt) {
        throw new Exception('Failed to execute query');
    }

    $token = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$token) {
        throw new Exception('Token not found');
    }

    echo json_encode([
        'success' => true,
        'token' => $token
    ]);
} catch (Exception $e) {
    error_log("Error in get_token_info.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load token info: ' . $e->getMessage()
    ]);
}