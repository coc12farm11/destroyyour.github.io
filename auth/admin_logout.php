<?php
session_start();
unset($_SESSION['admin_id']);
session_destroy();
echo json_encode(['success' => true]); 