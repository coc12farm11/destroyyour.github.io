document.addEventListener('DOMContentLoaded', function() {
    const tokenLinkInput = document.getElementById('tokenLinkInput');
    const tokenNameInputContainer = document.getElementById('tokenNameInputContainer');
    const tokenNameInput = document.getElementById('tokenNameInput');
    const addTokenBtn = document.getElementById('addTokenBtn');
    const tokenStatus = document.getElementById('tokenStatus');

    tokenLinkInput.addEventListener('input', function() {
        if (this.value.trim()) {
            tokenNameInputContainer.style.display = 'block';
        } else {
            tokenNameInputContainer.style.display = 'none';
            tokenNameInput.value = '';
        }
    });

    addTokenBtn.addEventListener('click', function() {
        const tokenLink = tokenLinkInput.value.trim();
        const tokenName = tokenNameInput.value.trim();

        if (!tokenLink) {
            showStatus('Пожалуйста, введите корректную pump.fun ссылку на токен', 'error');
            return;
        }
        if (!tokenName) {
            showStatus('Пожалуйста, введите название токена', 'error');
            return;
        }

        const tokenAddress = extractTokenAddress(tokenLink);  

        fetch('api/add_token.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tokenLink: tokenLink, tokenName: tokenName, tokenAddress: tokenAddress })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showStatus(data.message, 'success');
                tokenLinkInput.value = '';
                tokenNameInput.value = '';
                tokenNameInputContainer.style.display = 'none';
            } else {
                showStatus(data.message, 'error');
            }
        })
        .catch(error => {
            showStatus('Произошла ошибка при добавлении токена', 'error');
            console.error('Error:', error);
        });
    });

    function showStatus(message, type) {
        tokenStatus.textContent = message;
        tokenStatus.className = 'transactions-stats ' + type;
    }

    function extractTokenAddress(url) {
        const parts = url.split('/');
        return parts[parts.length - 1];
    }
});