class TransactionManager {
    constructor() {
        this.walletSelect = document.getElementById('walletSelect');
        this.loadTransactionsBtn = document.getElementById('loadTransactionsBtn');
        this.transactionsList = document.getElementById('transactionsList');
        this.totalTransactions = document.getElementById('totalTransactions');
        // this.totalVolume = document.getElementById('totalVolume');
        
        if (!this.walletSelect || !this.loadTransactionsBtn || !this.transactionsList) {
            console.error('Required elements not found');
            return;
        }
        
        this.initializeEventListeners();
        this.loadWallets();
    }
    
    initializeEventListeners() {
        this.walletSelect.addEventListener('change', () => {
            this.loadTransactionsBtn.disabled = !this.walletSelect.value;
            if (this.walletSelect.value) {
                this.loadTransactions();
            }
        });
        
        this.loadTransactionsBtn.addEventListener('click', () => this.loadTransactions());
    }
    
    async loadWallets() {
        try {
            const response = await fetch('api/get_wallets.php');
            
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server didn't return JSON");
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load wallets');
            }
            
            if (!Array.isArray(data.wallets)) {
                throw new Error('Invalid wallets data format');
            }

            const options = data.wallets.map(wallet => 
                `<option value="${wallet.public_key}">${wallet.public_key.substring(0, 8)}...</option>`
            );

            this.walletSelect.innerHTML = '<option value="">Select wallet</option>' + options.join('');
                        
        } catch (e) {
            console.error('Failed to load wallets:', e);
            this.showError('Failed to load wallets: ' + e.message);
        }
    }
    
    async loadTransactions() {
        try {
            const walletId = this.walletSelect.value;
            if (!walletId) return;
                        
            const response = await fetch(`api/get_transactions.php?wallet=${encodeURIComponent(walletId)}`);
            
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server didn't return JSON");
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load transactions');
            }
            
            this.renderTransactions(data.transactions || []);
            this.updateStats(data.stats || {});
            
        } catch (e) {
            console.error('Failed to load transactions:', e);
            this.showError('Failed to load transactions: ' + e.message);
        }
    }
    
    renderTransactions(transactions) {
        if (!Array.isArray(transactions)) {
            console.error('Invalid transactions data:', transactions);
            return;
        }

        if (transactions.length === 0) {
            this.transactionsList.innerHTML = '<div class="transaction-row">No transactions found</div>';
            return;
        }

        this.transactionsList.innerHTML = transactions.map(tx => `
            <div class="transaction-row">
                <div class="transaction-cell">${new Date(tx.created_at).toLocaleString()}</div>
                <div class="transaction-cell">${tx.type}</div>
                <div class="transaction-cell">${tx.amount} SOL</div>
                <div class="transaction-cell status-${tx.status.toLowerCase()}">${tx.status}</div>
            </div>
        `).join('');
    }
    
    updateStats(stats) {
        this.totalTransactions.textContent = stats.total || 0;
        // this.totalVolume.textContent = `${stats.volume || 0} SOL`;
    }

    showError(message) {
        console.error(message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TransactionManager();
}); 