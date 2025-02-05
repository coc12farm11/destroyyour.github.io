document.getElementById('auth-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const button = this.querySelector('button');
    const authKey = document.getElementById('auth-key').value;
    
    // Добавляем класс loading для анимации
    button.classList.add('loading');

    try {
        // Сначала получаем fingerprint
        const fingerprint = await generateFingerprint();
        
        const response = await fetch('auth/check_auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                auth_key: authKey,
                fingerprint: fingerprint
            })
        });

        const data = await response.json();
        console.log('Auth response:', data); // Отладка

        if (data.success) {
            // Анимация успешной авторизации
            button.style.backgroundColor = '#4CAF50';
            
            // Сохраняем fingerprint в localStorage для последующих проверок
            localStorage.setItem('userFingerprint', fingerprint);
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } else {
            showError(data.message || 'Ошибка авторизации');
        }
    } catch (error) {
        console.error('Auth error:', error);
        showError('Произошла ошибка при авторизации');
    } finally {
        // Убираем класс loading
        button.classList.remove('loading');
    }
});

function showError(message) {
    // Удаляем предыдущее сообщение об ошибке, если оно есть
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Создаем новое сообщение об ошибке
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Добавляем сообщение после формы
    document.getElementById('auth-form').appendChild(errorDiv);
} 