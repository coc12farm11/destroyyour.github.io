let browserFingerprint = null;

async function initAuth() {
    // Получаем сохраненный fingerprint или генерируем новый
    browserFingerprint = localStorage.getItem('userFingerprint');
    if (!browserFingerprint) {
        browserFingerprint = await generateFingerprint();
    }
    checkAuth();
}

async function checkAuth() {
    try {
        const response = await fetch('auth/check_auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fingerprint: browserFingerprint })
        });

        const data = await response.json();
        console.log('Check auth response:', data); // Отладка

        if (!data.authenticated) {
            // Очищаем fingerprint если авторизация не подтверждена
            localStorage.removeItem('userFingerprint');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('userFingerprint');
        window.location.href = 'login.html';
    }
}

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', initAuth);

// Добавляем обработчик для кнопки logout
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.querySelector('.nav_item_con[data-content="7"]');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
});

function handleLogout() {
    // Показываем индикатор загрузки
    document.querySelector('.loading').style.display = 'flex';
    
    // Отправляем запрос на сервер для выхода
    fetch('auth/logout.php', {
        method: 'POST',
        credentials: 'include' // Важно для работы с сессиями
    })
    .then(response => {
        if (response.ok) {
            // Очищаем локальное хранилище если оно используется
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            
            // Перенаправляем на страницу входа
            window.location.href = 'index.html';
        } else {
            throw new Error('Logout failed');
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
    })
    .finally(() => {
        // Скрываем индикатор загрузки
        document.querySelector('.loading').style.display = 'none';
    });
} 