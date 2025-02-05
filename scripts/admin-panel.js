// Проверка авторизации админа
async function checkAdminAuth() {
    try {
        const response = await fetch('../auth/check_admin_auth.php');
        const data = await response.json();
        if (!data.authenticated) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'login.html';
    }
}

// Загрузка списка ключей
async function loadAuthKeys() {
    try {
        const response = await fetch('../auth/get_auth_keys.php');
        const data = await response.json();
        
        const tableBody = document.getElementById('keys-table-body');
        tableBody.innerHTML = '';
        
        data.forEach(key => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${key.code}</td>
                <td>${key.description}</td>
                <td>${new Date(key.created_at).toLocaleString()}</td>
                <td>
                    <span class="status-badge ${key.is_active ? 'status-active' : 'status-inactive'}">
                        ${key.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                </td>
                <td>
                    ${key.is_active ? 
                        `<button class="action-button deactivate" onclick="deactivateKey(${key.id})">Деактивировать</button>` :
                        `<button class="action-button activate" onclick="activateKey(${key.id})">Активировать</button>`
                    }
                    <button class="action-button delete" onclick="deleteKey(${key.id})">Удалить</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Load keys error:', error);
    }
}

// Открытие модального окна
function openModal() {
    document.getElementById('add-key-modal').classList.add('active');
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('add-key-modal').classList.remove('active');
}

// Создание нового ключа
async function createAuthKey(description) {
    try {
        const response = await fetch('../auth/create_auth_key.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description })
        });
        
        const data = await response.json();
        if (data.success) {
            loadAuthKeys();
            closeModal();
        } else {
            alert(data.message || 'Ошибка при создании ключа');
        }
    } catch (error) {
        console.error('Create key error:', error);
        alert('Ошибка при создании ключа');
    }
}

// Деактивация ключа
async function deactivateKey(id) {
    if (!confirm('Вы уверены, что хотите деактивировать этот ключ?')) return;
    
    try {
        const response = await fetch('../auth/deactivate_auth_key.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id })
        });
        
        const data = await response.json();
        if (data.success) {
            loadAuthKeys();
        } else {
            alert(data.message || 'Ошибка при деактивации ключа');
        }
    } catch (error) {
        console.error('Deactivate key error:', error);
        alert('Ошибка при деактивации ключа');
    }
}

// Удаление ключа
async function deleteKey(id) {
    if (!confirm('Вы уверены, что хотите удалить этот ключ?')) return;
    
    try {
        const response = await fetch('../auth/delete_auth_key.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id })
        });
        
        const data = await response.json();
        if (data.success) {
            loadAuthKeys();
        } else {
            alert(data.message || 'Ошибка при удалении ключа');
        }
    } catch (error) {
        console.error('Delete key error:', error);
        alert('Ошибка при удалении ключа');
    }
}

// Выход из админ-панели
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await fetch('../auth/admin_logout.php');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Обработка формы создания ключа
document.getElementById('add-key-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = document.getElementById('key-description').value;
    await createAuthKey(description);
});

// Открытие модального окна при нажатии на кнопку создания ключа
document.getElementById('add-key-btn').addEventListener('click', openModal);

// Добавляем новую функцию для активации ключа
async function activateKey(id) {
    if (!confirm('Вы уверены, что хотите активировать этот ключ?')) return;
    
    try {
        const response = await fetch('../auth/activate_auth_key.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id })
        });
        
        const data = await response.json();
        if (data.success) {
            loadAuthKeys();
        } else {
            alert(data.message || 'Ошибка при активации ключа');
        }
    } catch (error) {
        console.error('Activate key error:', error);
        alert('Ошибка при активации ключа');
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadAuthKeys();
}); 