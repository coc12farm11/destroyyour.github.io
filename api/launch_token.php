<?php
// api/launch_token.php

header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

try {
    // Проверяем подключение к БД
    if (!$pdo) {
        throw new Exception('Database connection not available');
    }

    // Получаем данные из POST-запроса
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // Проверяем наличие всех необходимых данных
    // if (!isset($data['token_id']) || !isset($data['funding_wallet_id']) || !isset($data['buyer_wallet_ids'])) {
    //     throw new Exception('Missing required data');
    // }

    if (!isset($data['token_id']) || !isset($data['buyer_wallet_ids'])) {
        throw new Exception('Missing required data');
    }

    // Начинаем транзакцию
    $pdo->beginTransaction();

    // Получаем информацию о токене
    $stmt = $pdo->prepare("SELECT name FROM tokens WHERE id = ?");
    $stmt->execute([$data['token_id']]);
    $token = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$token) {
        throw new Exception('Token not found');
    }

    // Подготавливаем строку с кошельками покупателей
    $buyerWallets = implode(',', $data['buyer_wallet_ids']);

    // Вставляем новый проект
    $stmt = $pdo->prepare("INSERT INTO projects (name, wallets, token_id, is_active, created_at) VALUES (?, ?, ?, 1, NOW())");
    if (!$stmt->execute([$token['name'], $buyerWallets, $data['token_id']])) {
        throw new Exception('Failed to create project');
    }

    $projectId = $pdo->lastInsertId();

    // Завершаем транзакцию
    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Token launched successfully',
        'project_id' => $projectId
    ]);

} catch (Exception $e) {
    // В случае ошибки откатываем транзакцию
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo json_encode([
        'success' => false,
        'message' => 'Failed to launch token: ' . $e->getMessage()
    ]);
}