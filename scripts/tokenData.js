class TokenDataManager {
    constructor(rpcEndpoint = 'https://solana-mainnet.rpc.extrnode.com/6a0f493c-e3ff-4d53-97eb-a0bd002499a9') {
        this.connection = new solanaWeb3.Connection(rpcEndpoint, 'confirmed');
    }

    async fetchTokenData(tokenMint) {
        try {
            const CORS_PROXY = "https://api.allorigins.win/raw?url=";
            const API_URL = encodeURIComponent(`https://frontend-api.pump.fun/coins/${tokenMint}`);
            const fullUrl = `${CORS_PROXY}${API_URL}`;

            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            return {
                name: data.name || 'N/A',
                symbol: data.symbol || 'N/A',
                description: data.description || 'N/A',
                tokenKey: data.token_key || 'N/A',
                devKey: data.dev_key || 'N/A',
                price: data.price,
                marketCap: data.market_cap,
                solReserves: data.virtual_sol_reserves
            };
        } catch (error) {
            console.error('Ошибка при получении данных через API:', error);
            throw error;
        }
    }

    async updateUIWithTokenData(tokenUrl, tokenAddress) {
        try {
            const tokenData = await this.fetchTokenData(tokenAddress);
            // console.log('Token Data:', tokenData);
            
            const updates = [
                {
                    selector: '#tokenName',
                    value: tokenData.name,
                    formatter: (value) => value
                },
                {
                    selector: '#tokenSymbol',
                    value: tokenData.symbol,
                    formatter: (value) => value
                },
                {
                    selector: '#tokenDescription',
                    value: tokenData.description,
                    formatter: (value) => value
                },
                {
                    selector: '#tokenKey',
                    value: tokenData.tokenKey,
                    formatter: (value) => value
                },
                {
                    selector: '#devKey',
                    value: tokenData.devKey,
                    formatter: (value) => value
                },
                {
                    selector: '#price',
                    value: tokenData.price,
                    formatter: (value) => value.toFixed(10)
                },
                {
                    selector: '#marketCap',
                    value: tokenData.marketCap,
                    formatter: (value) => `$${value.toLocaleString()}`
                },
                {
                    selector: '#solReserves',
                    value: tokenData.solReserves,
                    formatter: (value) => value.toFixed(9)
                },
                {
                    selector: '#pumpfunLink',
                    value: `<a href='${tokenUrl}' target="_blank" class="blu">Link</a>`,
                    formatter: (value) => value,
                    useHTML: true
                }
            ];

            updates.forEach(({selector, value, formatter, useHTML}) => {
                this.updateElement(selector, value, formatter, useHTML);
            });

            return tokenData;
        } catch (error) {
            console.error('Ошибка при обновлении UI:', error);
            this.showError('Не удалось обновить данные токена. Пожалуйста, попробуйте позже.');
        }
    }

    updateElement(selector, value, formatter, useHTML = false) {
        const element = document.querySelector(selector);
        if (element && value != null) {
            const newValue = formatter(value);
            if (useHTML) {
                element.innerHTML = newValue;
            } else {
                element.textContent = newValue;
            }
            this.animateValue(element, '', newValue);
        }
    }

    animateValue(element, oldValue, newValue) {
        if (element) {
            element.style.transition = 'color 0.3s';
            element.style.color = '#467bff';
            
            setTimeout(() => {
                element.style.color = '';
            }, 300);
        }
    }

    showError(message) {
        let errorContainer = document.querySelector('.error-container');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'error-container';
            document.body.appendChild(errorContainer);
        }

        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        errorContainer.appendChild(errorElement);

        setTimeout(() => {
            errorElement.classList.add('removing');
            
            errorElement.addEventListener('animationend', () => {
                errorElement.remove();
                
                if (errorContainer.children.length === 0) {
                    errorContainer.remove();
                }
            });
        }, 5000);
    }
}

// Пример использования
const TOKEN_URL = "https://pump.fun/coin/D5U74oLHp4qsRxfBCH6LpVeWqQXY5XwgTW1s9h37pump";
const TOKEN_MINT = TOKEN_URL.split('/').pop();

const tokenManager = new TokenDataManager();

// Первоначальное получение данных
tokenManager.updateUIWithTokenData(TOKEN_URL, TOKEN_MINT);

// Установка интервала обновления
// const updateInterval = setInterval(() => {
//     tokenManager.updateUIWithTokenData(TOKEN_MINT);
// }, 60000);

// // Очистка интервала при закрытии страницы
// window.addEventListener('beforeunload', () => {
//     clearInterval(updateInterval);
// });