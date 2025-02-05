document.addEventListener('DOMContentLoaded', function() {
    const tokenSelect = document.getElementById('tokenSelect');
    const tokenInfo = document.getElementById('tokenInfo');
    // const fundingWalletSelect = document.getElementById('fundingWalletSelect');
    const addWalletBtn = document.getElementById('addWalletBtn');
    const deleteWalletBtn = document.getElementById('deleteWalletBtn');
    const buyerWalletsTable = document.getElementById('buyerWalletsTable').getElementsByTagName('tbody')[0];
    const launchTokenBtn = document.getElementById('launchTokenBtn');

    let wallets = [];

    const web3Connection = new solanaWeb3.Connection(
        'https://solana-mainnet.g.alchemy.com/v2/dfSBrSUHOE1TQEN-1klH7aVLXP6cQijw',
        'confirmed'
    );

    async function getWalletBalance1(publicKey) {
        try {
            const pubKey = new solanaWeb3.PublicKey(publicKey);
            const balance = await web3Connection.getBalance(pubKey);
            return balance / solanaWeb3.LAMPORTS_PER_SOL;
        } catch (error) {
            console.error('Error fetching balance:', error);
            return 0;
        }
    }

    function loadTokens() {
        fetch('api/get_tokens.php')
            .then(response => response.json())
            .then(data => {
                data.tokens.forEach(token => {
                    const option = document.createElement('option');
                    option.value = token.id;
                    option.textContent = `${token.name} (${token.symbol})`;
                    tokenSelect.appendChild(option);
                });
            });
    }

    async function loadWallets() {
        try {
            const response = await fetch('api/get_wallets.php');
            const data = await response.json();
            wallets = await Promise.all(data.wallets.map(async (wallet) => {
                const balance = await getWalletBalance1(wallet.public_key);
                return {...wallet, balance};
            }));
            updateWalletSelects();
        } catch (error) {
            console.error('Error loading wallets:', error);
        }
    }

    function updateWalletSelects() {
        const selectedWallets = Array.from(buyerWalletsTable.querySelectorAll('select')).map(select => select.value);
        
        // Обновляем выбор кошелька финансирования
        // fundingWalletSelect.innerHTML = '<option value="">Выберите кошелек</option>';
        // wallets.forEach(wallet => {
        //     const option = document.createElement('option');
        //     option.value = wallet.id;
        //     option.textContent = `Баланс: ${wallet.balance.toFixed(4)} SOL - ${wallet.public_key}`;
        //     fundingWalletSelect.appendChild(option);
        // });

        // Обновляем выбор кошельков покупателей
        buyerWalletsTable.querySelectorAll('select').forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Нет кошелька</option>';
            wallets.forEach(wallet => {
                if (!selectedWallets.includes(wallet.id.toString()) || wallet.id.toString() === currentValue) {
                    const option = document.createElement('option');
                    option.value = wallet.id;
                    option.textContent = `Баланс: ${wallet.balance.toFixed(4)} SOL - ${wallet.public_key}`;
                    select.appendChild(option);
                }
            });
            select.value = currentValue;
        });
    }

    tokenSelect.addEventListener('change', function() {
        const selectedTokenId = this.value;
        if (selectedTokenId) {
            fetch(`api/get_token_info.php?id=${selectedTokenId}`)
                .then(response => response.json())
                .then(token => {
                    let token_address = token.token.address;
                    if (token_address.length > 15) {
                        token_address = token_address.substring(0, 15) + '...';
                    }
                    tokenInfo.innerHTML = `
                        <p><strong>Название:</strong> ${token.token.name}</p>
                        <p><strong>Символ:</strong> ${token.token.symbol}</p>
                        <p><strong>Описание:</strong> ${token.token.description}</p>
                        <p><strong>Адрес:</strong> ${token_address}</p>
                    `;
                });
        } else {
            tokenInfo.innerHTML = '';
        }
    });

    function addWalletRow() {
        const rowCount = buyerWalletsTable.rows.length;
        const row = buyerWalletsTable.insertRow(rowCount);
        
        const cell1 = row.insertCell(0);
        cell1.innerHTML = rowCount + 1;

        const cell2 = row.insertCell(1);
        const select = document.createElement('select');
        select.className = 'wallet-select';
        cell2.appendChild(select);

        select.addEventListener('change', updateWalletSelects);
        updateWalletSelects();
    }

    addWalletBtn.addEventListener('click', addWalletRow);

    deleteWalletBtn.addEventListener('click', function() {
        const rowCount = buyerWalletsTable.rows.length;
        if (rowCount > 0) {
            buyerWalletsTable.deleteRow(rowCount - 1);
            updateWalletSelects();
        }
    });

    launchTokenBtn.addEventListener('click', function() {
        const tokenId = tokenSelect.value;
        // const fundingWalletId = fundingWalletSelect.value;
        const buyerWallets = Array.from(buyerWalletsTable.querySelectorAll('select'))
            .map(select => select.value)
            .filter(value => value !== "");

        if (!tokenId || buyerWallets.length === 0) {
            alert('Please fill in all required fields');
            return;
        }

        const projectData = {
            token_id: tokenId,
            // funding_wallet_id: fundingWalletId,
            buyer_wallet_ids: buyerWallets
        };

        fetch('api/launch_token.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Token launched successfully!');
                // Обновляем список активных проектов
                if (typeof loadActiveProjects === 'function') {
                    loadActiveProjects().then(() => {
                        // После обновления списка, выбираем новый проект
                        const newProjectElement = document.querySelector(`.nav_pro_item[data-content="${data.project_id}"]`);
                        if (newProjectElement) {
                            newProjectElement.click();
                        }
                    });
                }
            } else {
                alert('Error launching token: ' + data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred while launching the token');
        });
    });

    loadTokens();
    loadWallets().then(() => {
        addWalletRow();
    });

});

