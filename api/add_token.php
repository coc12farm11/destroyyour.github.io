<?php
header('Content-Type: application/json');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $tokenLink = $input['tokenLink'] ?? '';
    $tokenName = $input['tokenName'] ?? '';
    $tokenAddress = $input['tokenAddress'] ?? '';

    if (empty($tokenLink)) {
        echo json_encode(['success' => false, 'message' => 'Token link is required']);
        exit;
    }

    if (empty($tokenName)) {
        echo json_encode(['success' => false, 'message' => 'Token name is required']);
        exit;
    }

    if (empty($tokenAddress)) {
        echo json_encode(['success' => false, 'message' => 'Token address is required']);
        exit;
    }

    $tokenInfo = getTokenInfoFromPumpFun($tokenLink);

    if ($tokenInfo) {
        $stmt = $pdo->prepare("INSERT INTO tokens (address, name, symbol, description, pump_fun_link) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $tokenAddress,
            $tokenName,
            $tokenInfo['symbol'],
            $tokenInfo['description'],
            $tokenLink
        ]);

        echo json_encode(['success' => true, 'message' => 'Token added successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to retrieve token information']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

function getTokenInfoFromPumpFun($tokenLink) {

    return [
        'name' => 'Example Token',
        'symbol' => 'EXT',
        'description' => 'This is an example token',
        'address' => '0x1234567890abcdef'
    ];
}