// Добавляем проверку и получение Keypair из глобального объекта solanaWeb3
const { Keypair } = solanaWeb3;

class WalletManager {
    constructor() {
        if (!Keypair) {
            throw new Error('Solana Web3 library not loaded properly');
        }
        
        this.textarea = document.getElementById('secretKeysInput');
        this.validateBtn = document.getElementById('validateBtn');
        this.addWalletsBtn = document.getElementById('addWalletsBtn');
        this.walletsCount = document.getElementById('walletsCount');
        this.validationStatus = document.getElementById('validationStatus');
        
        this.validWallets = [];
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        this.validateBtn.addEventListener('click', () => this.validateKeys());
        this.addWalletsBtn.addEventListener('click', () => this.addWallets());
        this.textarea.addEventListener('input', () => {
            this.addWalletsBtn.disabled = true;
            this.validationStatus.textContent = '';
            this.updateWalletsCount();
        });
    }
    
    updateWalletsCount() {
        const lines = this.textarea.value.trim().split('\n').filter(line => line.trim());
        this.walletsCount.textContent = lines.length;
    }
    
    async validateKeys() {
        try {
            if (!Keypair) {
                throw new Error('Solana Web3 library not initialized');
            }

            const keys = this.textarea.value.trim().split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        console.error('Failed to parse key:', line, e);
                        return null;
                    }
                })
                .filter(key => key !== null);

            if (keys.length === 0) {
                throw new Error('No valid key format found');
            }

            this.validWallets = [];
            let errors = [];

            for (let secretKey of keys) {
                try {
                    const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
                    this.validWallets.push({
                        secretKey: JSON.stringify(Array.from(keypair.secretKey)),
                        publicKey: keypair.publicKey.toString()
                    });
                } catch (e) {
                    console.error('Invalid key:', secretKey, e);
                    errors.push(`Invalid key format: ${JSON.stringify(secretKey).substring(0, 20)}...`);
                }
            }

            if (errors.length > 0) {
                this.validationStatus.textContent = `Found ${errors.length} invalid keys`;
                this.validationStatus.className = 'validation-status error';
            } else {
                this.validationStatus.textContent = `Validated ${this.validWallets.length} keys successfully`;
                this.validationStatus.className = 'validation-status success';
                this.addWalletsBtn.disabled = false;
            }
        } catch (e) {
            console.error('Validation failed:', e);
            this.validationStatus.textContent = 'Validation failed: ' + e.message;
            this.validationStatus.className = 'validation-status error';
        }
    }
    
    async addWallets() {
        try {
            const response = await fetch('api/add_wallets.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    wallets: this.validWallets
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server didn't return JSON");
            }

            const result = await response.json();

            if (result.success) {
                this.validationStatus.textContent = result.message;
                this.validationStatus.className = 'validation-status success';
                this.textarea.value = '';
                this.updateWalletsCount();
                this.addWalletsBtn.disabled = true;
            } else {
                throw new Error(result.message || 'Unknown error occurred');
            }
        } catch (e) {
            console.error('Add wallets error:', e);
            this.validationStatus.textContent = 'Failed to add wallets: ' + e.message;
            this.validationStatus.className = 'validation-status error';
        }
    }
}

// Ждем загрузки как DOM, так и Solana Web3.js
window.addEventListener('load', () => {
    if (typeof solanaWeb3 === 'undefined') {
        console.error('Solana Web3 library not loaded');
        return;
    }
    new WalletManager();
}); 