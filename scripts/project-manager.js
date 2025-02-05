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
                solReserves: data.virtual_sol_reserves,
                pumpfunLink: `https://pump.fun/coin/${tokenMint}`
            };
        } catch (error) {
            console.error('Ошибка при получении данных через API:', error);
            throw error;
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

const tokenManager = new TokenDataManager();

function loadActiveProjects() {
    return fetch('api/get_active_projects.php')
        .then(response => response.json())
        .then(data => {
            const projectsContainer = document.querySelector('.nav_pro');
            const activeProjectsTitle = projectsContainer.querySelector('.nav_pro_title');
            let activeProjectsContainer = projectsContainer.querySelector('.active-projects-container');

            if (data.success && data.projects.length > 0) {
                if (activeProjectsTitle) {
                    activeProjectsTitle.style.display = 'block';
                }

                if (!activeProjectsContainer) {
                    activeProjectsContainer = document.createElement('div');
                    activeProjectsContainer.className = 'active-projects-container';
                    projectsContainer.insertBefore(activeProjectsContainer, projectsContainer.children[1]);
                }

                activeProjectsContainer.innerHTML = '';

                data.projects.forEach(project => {
                    const projectElement = document.createElement('div');
                    projectElement.className = 'nav_pro_item';
                    projectElement.setAttribute('data-content', project.id);
                    projectElement.innerHTML = `
                        <svg class="sett" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><title/><g id="setting"><path d="M9,7H7V3A1,1,0,0,0,5,3V7H3A1,1,0,0,0,2,8v3a1,1,0,0,0,1,1H5V29a1,1,0,0,0,2,0V12H9a1,1,0,0,0,1-1V8A1,1,0,0,0,9,7Z"/><path d="M19,20H17V3a1,1,0,0,0-2,0V20H13a1,1,0,0,0-1,1v3a1,1,0,0,0,1,1h2v4a1,1,0,0,0,2,0V25h2a1,1,0,0,0,1-1V21A1,1,0,0,0,19,20Z"/><path d="M29,7H27V3a1,1,0,0,0-2,0V7H23a1,1,0,0,0-1,1v3a1,1,0,0,0,1,1h2V29a1,1,0,0,0,2,0V12h2a1,1,0,0,0,1-1V8A1,1,0,0,0,29,7Z"/></g></svg>
                        <p class="nav_pro_item_p">${project.name} (${project.token_id})</p>
                    `;
                    activeProjectsContainer.appendChild(projectElement);
                });

                addProjectClickHandlers();
            } else {
                if (activeProjectsTitle) {
                    activeProjectsTitle.style.display = 'none';
                }

                if (activeProjectsContainer) {
                    activeProjectsContainer.innerHTML = '';
                }

                console.error('Failed to load active projects or no projects available:', data.message);
            }

            return data.projects || [];
        })
        .catch(error => {
            console.error('Error:', error);
            return [];
        });
}

async function loadProjectData(projectId) {
    try {
        const response = await fetch(`api/get_project_data.php?id=${projectId}`);
        const data = await response.json();

        const response2 = await fetch(`api/get_token_info.php?id=${data.project.token_id}`)
        const tokenInfo = await response2.json()

        const response3 = await fetch(`api/get_wallets.php`)
        const allWallets = await response3.json()

        const allWalletsCount = allWallets.count;
        const allWalletsKeys = allWallets.wallets;
        const tokenAddress = tokenInfo.token.address;

        await displayProjectWallets(allWalletsKeys, tokenAddress);
        
        const wallets = data.project.wallets;

        const count = wallets.split(',').map(item => item.trim()).length;
        const maxWallets = allWalletsCount;
        document.getElementById('currentWalletsCount').textContent = `${count} out of ${maxWallets}`;

        if (count != maxWallets) {
            document.getElementById('isButtonOk').innerHTML = `<button class=" btn">Add wallet</button>`;
        } else {
            document.getElementById('isButtonOk').innerHTML = ``;
        }

        const contentElement = document.querySelector('#content1');
        if (contentElement) {
            contentElement.setAttribute('data-project-id', projectId);
        }

        if (data.success) {
            const tokenData = await tokenManager.fetchTokenData(tokenAddress);

            document.getElementById('tokenName').textContent = tokenData.name;
            document.getElementById('tokenSymbol').textContent = tokenData.symbol;
            document.getElementById('tokenDescription').textContent = tokenData.description;
            // document.getElementById('tokenKey').textContent = tokenData.tokenKey;
            // document.getElementById('devKey').textContent = tokenData.devKey;
            
            if (document.getElementById('price')) {
                document.getElementById('price').textContent = tokenData.price ? tokenData.price.toFixed(10) : 'N/A';
            }
            if (document.getElementById('marketCap')) {
                document.getElementById('marketCap').textContent = tokenData.marketCap ? 
                    `$${tokenData.marketCap.toLocaleString()}` : 'N/A';
            }
            if (document.getElementById('solReserves')) {
                document.getElementById('solReserves').textContent = tokenData.solReserves ? 
                    tokenData.solReserves.toFixed(9) : 'N/A';
            }

            const pumpfunLinkElement = document.getElementById('pumpfunLink');
            if (pumpfunLinkElement) {
                pumpfunLinkElement.innerHTML = `<a href='${tokenData.pumpfunLink}' target="_blank" class="blu">Link</a>`;
            }

        } else {
            console.error('Failed to load project data:', data.message);
            tokenManager.showError('Не удалось загрузить данные проекта');
        }
    } catch (error) {
        console.error('Error:', error);
        tokenManager.showError('Произошла ошибка при загрузке данных');
    }
}

async function getWalletBalance2(publicKey, token_address) {
    const pubKey = new solanaWeb3.PublicKey(publicKey);

    const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const tokenAccounts = await web3Connection.getParsedTokenAccountsByOwner(pubKey, {
        programId: TOKEN_PROGRAM_ID,
    });

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

async function displayProjectWallets(wallets, tokenAddress) {
    const walletsContainer = document.getElementById('projectWallets');
    walletsContainer.innerHTML = '';

    for (const [index, wallet] of wallets.entries()) {
        const walletTokenBalance = await getWalletBalance2(wallet.public_key, tokenAddress);
        const walletElement = document.createElement('div');
        walletElement.className = 'content_row_tree_item_content';
        walletElement.innerHTML = `
            <p class="content_row_tree_item_content_one">${index + 1}.</p>
            <p class="content_row_tree_item_content_two">${wallet.public_key.slice(0, 6)}</p>
            <svg class="content_row_tree_item_content_tree" style="fill: #467bff;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="mdi-database" width="24" height="24" viewBox="0 0 24 24"><path d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z" /></svg>
            <p class="content_row_tree_item_content_four">${walletTokenBalance}</p>
        `;
        walletsContainer.appendChild(walletElement);
    }
}

function initializePage() {
    loadActiveProjects().then(projects => {
        if (projects.length > 0) {
            loadProjectData(projects[0].id);

            const firstProject = document.querySelector('.nav_pro_item');
            if (firstProject) {
                firstProject.classList.add('active-background');
            }
            changeContent(0);
        } else {
            const launchTokenElement = document.querySelector('[data-content="1"]');
            if (launchTokenElement) {
                launchTokenElement.click();
            }
        }
    });
}

function addProjectClickHandlers() {
    document.querySelectorAll('.nav_pro_item').forEach(item => {
        item.addEventListener('click', function() {
            const projectId = this.getAttribute('data-content');
            const contentElement = document.querySelector('#content1');

            if (contentElement) {
                contentElement.setAttribute('data-project-id', projectId);
            }
            console.log("Айди добавлен");

            loadProjectData(projectId);
            
            document.querySelectorAll('.nav_pro_item').forEach(el => {
                el.classList.remove('active-background');
            });
            this.classList.add('active-background');

            changeContent(0);
        });
    });
}

document.addEventListener('DOMContentLoaded', initializePage);