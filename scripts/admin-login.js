document.getElementById('admin-auth-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const button = this.querySelector('button');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    console.log('Attempting login with:', { username, password }); // отладка
    
    button.classList.add('loading');

    try {
        const response = await fetch('../auth/admin_login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();
        console.log('Server response:', data); // отладка

        if (data.success) {
            button.style.backgroundColor = '#4CAF50';
            setTimeout(() => {
                window.location.href = 'panel.html';
            }, 500);
        } else {
            showError(data.message || 'Ошибка авторизации');
        }
    } catch (error) {
        console.error('Login error:', error); // отладка
        showError('Произошла ошибка при авторизации');
    } finally {
        button.classList.remove('loading');
    }
});

function showError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.getElementById('admin-auth-form').appendChild(errorDiv);
} 