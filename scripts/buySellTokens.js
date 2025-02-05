const RPC_ENDPOINT = "https://solana-mainnet.rpc.extrnode.com/6a0f493c-e3ff-4d53-97eb-a0bd002499a9";

const web3Connection = new solanaWeb3.Connection(
    RPC_ENDPOINT,
    'confirmed',
);

async function sendPumpTransaction(action, mint, secretKey, amount) {
    let denominatedInSol = "true";

    if (action === "sell") {
        denominatedInSol = "false";
    }
    const secretKeyArray = JSON.parse(secretKey);

    const secretKeyUint8Array = new Uint8Array(secretKeyArray);

    const signerKeyPair = solanaWeb3.Keypair.fromSecretKey(secretKeyUint8Array);
    const signerPublicKey = signerKeyPair.publicKey.toBase58();

    const response = await fetch(`https://pumpportal.fun/api/trade-local`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            publicKey: signerPublicKey,
            "action": action, // "buy" или "sell"
            "mint": mint, // адрес контракта токена, которым хотите торговать
            "denominatedInSol": denominatedInSol,  // "true" если amount в SOL, "false" если amount в токенах
            "amount": amount, // количество SOL или токенов
            "slippage": 15, // допустимое проскальзывание в процентах
            "priorityFee": 0.001, // приоритетная комиссия
            "pool": "pump"
        })
    });

    if (response.status === 200) {
        const data = await response.arrayBuffer();
        const tx = solanaWeb3.VersionedTransaction.deserialize(new Uint8Array(data));
        tx.sign([signerKeyPair]);
        let signature;
        try {
            signature = await web3Connection.sendTransaction(tx, { preflightCommitment: "processed" });
        } catch (e) {
            console.error(e.message);
        }
        console.log("Transaction: https://solscan.io/tx/" + signature);
    } else {
        console.log(response.statusText);
    }
}

async function getWalletBalance(publicKey, buyOrSell, token_address) {
    const pubKey = new solanaWeb3.PublicKey(publicKey);
    
    if (buyOrSell === "buy") {
        try {
            const balance = await web3Connection.getBalance(pubKey);
            return balance / solanaWeb3.LAMPORTS_PER_SOL;
        } catch (error) {
            console.error('Error fetching balance:', error);
            return 0;
        }
    } else if (buyOrSell === "sell") {
        const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        const tokenAccounts = await web3Connection.getParsedTokenAccountsByOwner(pubKey, {
            programId: TOKEN_PROGRAM_ID,
        });

        console.log(tokenAccounts);

        const specificToken = tokenAccounts.value.find(tokenAccount => 
            tokenAccount.account.data.parsed.info.mint === token_address
        );

        if (specificToken) {
            const tokenData = specificToken.account.data.parsed.info;
            
            const tokenInfo = {
                mint: tokenData.mint,
                owner: tokenData.owner,
                balance: tokenData.tokenAmount.uiAmount,
                decimals: tokenData.tokenAmount.decimals,
                address: specificToken.pubkey.toString()
            };

            console.log(`Баланс: ${tokenInfo.balance}`);

            return tokenInfo.balance;
        } else {
            console.log('Токен не найден в кошельке');
            return 0;
        }
    }
}

async function calculateAmount(percentage, publicKey, buyOrSell, token_address) {
    const balance = await getWalletBalance(publicKey, buyOrSell, token_address);
    return (balance * percentage) / 100;
}

async function tokensCommand(selectedPercentage, currentProjectId, buyOrSell) {
    try {
        const response = await fetch(`api/get_project_data.php?id=${currentProjectId}`);
        const data = await response.json();

        const response2 = await fetch(`api/get_token_info.php?id=${data.project.token_id}`);
        const data_token = await response2.json();
        const token_address = data_token.token.address;

        const raw_wallets = data.project.wallets;
        const wallets = raw_wallets.split(',').map(item => item.trim());

        for (const walletId of wallets) {
            const response = await fetch(`api/get_wallet_data.php?id=${walletId}`);
            const wallet_data = await response.json();

            const publicKey = wallet_data.project.public_key;
            const secretKey = wallet_data.project.secret_key;

            try {
                const amount = await calculateAmount(selectedPercentage, publicKey, buyOrSell, token_address);

                if (amount === 0) {
                    continue;
                }
                
                await sendPumpTransaction(
                    buyOrSell,
                    token_address,
                    secretKey, 
                    amount
                );

                await fetch(`api/update_balance.php?id=${walletId}`);
                
                console.log(`${buyOrSell === 'buy' ? 'Покупка' : 'Продажа'} выполнена для кошелька ${walletId} на сумму ${amount} ${buyOrSell === 'buy' ? 'SOL' : 'токенов'}`);
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
            } catch (walletError) {
                console.error(`Ошибка при обработке кошелька ${walletId}:`, walletError);
                continue;
            }
        }
        
        console.log('Все операции завершены');
        
    } catch (error) {
        console.error('Ошибка при выполнении tokensCommand:', error);
        throw error;
    }
}

async function showError(message) {
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

async function showSuccess(message) {
    let errorContainer = document.querySelector('.error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        document.body.appendChild(errorContainer);
    }

    const errorElement = document.createElement('div');
    errorElement.className = 'success-message';
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

document.addEventListener('DOMContentLoaded', function() {
    const percentageBtns = document.querySelectorAll('.percentage-btn');
    const buyBtn = document.getElementById('buyBtn');
    const sellBtn = document.getElementById('sellBtn');
    let selectedPercentage = null;

    percentageBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            percentageBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedPercentage = parseInt(this.dataset.percentage);
        });
    });

    buyBtn.addEventListener('click', function() {
        const currentProjectId = document.querySelector('#content1').getAttribute('data-project-id');
    
        if (selectedPercentage) {
            if (currentProjectId) { 
                console.log(`Покупка ${selectedPercentage}% для всех кошельков`);
                tokensCommand(selectedPercentage, currentProjectId, "buy")
                    .then(() => showSuccess('Покупка успешно выполнена'))
                    .catch(error => showError('Ошибка при покупке: ' + error.message));
            } else {
                showError("Не выбран проект");
            }
        } else {
            showError('Пожалуйста, выберите процент перед покупкой');
        }
    });

    sellBtn.addEventListener('click', function() {
        const currentProjectId = document.querySelector('#content1').getAttribute('data-project-id');

        if (selectedPercentage) {
            if (currentProjectId) { 
                console.log(`Продажа ${selectedPercentage}% для всех кошельков`);
                tokensCommand(selectedPercentage, currentProjectId, "sell")
                    .then(() => showSuccess('Продажа успешно выполнена'))
                    .catch(error => showError('Ошибка при продаже: ' + error.message));
            } else {
                showError("Не выбран проект");
            }
        } else {
            showError('Пожалуйста, выберите процент перед продажей');
        }
    });
});