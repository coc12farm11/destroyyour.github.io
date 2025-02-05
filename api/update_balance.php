<?php
header('Content-Type: application/json');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $balance = $input['balance'] ?? null;

    if ($balance === null) {
        echo json_encode(['success' => false, 'message' => 'Balance is required']);
        exit;
    }

    try {
        // Сначала проверяем, есть ли записи в таблице
        $checkStmt = $pdo->query("SELECT COUNT(*) FROM funding_balance");
        $count = $checkStmt->fetchColumn();

        if ($count == 0) {
            // Если записей нет, создаем первую запись
            $stmt = $pdo->prepare("INSERT INTO funding_balance (balance) VALUES (?)");
            $stmt->execute([$balance]);
        } else {
            // Если запись существует, обновляем баланс
            $stmt = $pdo->prepare("UPDATE funding_balance SET balance = balance + ? WHERE id = 1");
            $stmt->execute([$balance]);
        }

        echo json_encode([
            'success' => true, 
            'message' => 'Balance updated successfully',
            'new_balance' => $balance
        ]);

    } catch (PDOException $e) {
        error_log("Error in update_balance.php: " . $e->getMessage());
        echo json_encode([
            'success' => false, 
            'message' => 'Failed to update balance: ' . $e->getMessage()
        ]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}