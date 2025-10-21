// Confidential Perp DEX Frontend Application
import { ethers } from 'https://cdn.ethers.io/lib/ethers-5.7.esm.min.js';

// Contract ABI (simplified version - include only necessary functions)
const CONTRACT_ABI = [
    "function deposit(bytes memory encryptedAmount) external",
    "function getBalance() external view returns (uint256)",
    "function openPosition(bytes memory encSize, uint8 leverage, bool isLong, bytes memory encStopLoss, bytes memory encTakeProfit) external returns (bytes32)",
    "function closePosition(bytes32 positionId) external",
    "function updateStopLossTakeProfit(bytes32 positionId, bytes memory encStopLoss, bytes memory encTakeProfit) external",
    "function placeOrder(bytes memory encPrice, bytes memory encSize, bool isLong) external returns (uint256)",
    "function getUserPositions(address user) external view returns (bytes32[])",
    "function getOrderBookSize() external view returns (uint256)",
    "event PositionOpened(address indexed trader, bytes32 indexed positionId, bool isLong)",
    "event PositionClosed(address indexed trader, bytes32 indexed positionId)",
    "event StopLossTriggered(address indexed trader, bytes32 indexed positionId)",
    "event TakeProfitTriggered(address indexed trader, bytes32 indexed positionId)",
    "event StopLossTakeProfitUpdated(address indexed trader, bytes32 indexed positionId)",
    "event OrderPlaced(address indexed trader, uint256 indexed orderId, bool isLong)",
    "event BalanceDeposited(address indexed user, uint256 amount)"
];

class ConfidentialPerpDEXApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.fhevmInstance = null;
        this.userAddress = null;
        this.contractAddress = null;

        // State
        this.positions = [];
        this.orders = [];

        this.init();
    }

    async init() {
        // Load contract address from environment or use default
        this.contractAddress = this.loadContractAddress();

        // Setup UI event listeners
        this.setupEventListeners();

        // Setup tab navigation
        this.setupTabs();

        // Check if wallet is already connected
        await this.checkConnection();
    }

    loadContractAddress() {
        // Try to load from localStorage or use a placeholder
        return localStorage.getItem('contract_address') || '0x0000000000000000000000000000000000000000';
    }

    setupEventListeners() {
        // Wallet connection
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('disconnectWallet')?.addEventListener('click', () => this.disconnectWallet());

        // Configuration modal
        document.getElementById('configureContract').addEventListener('click', () => this.openConfigModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeConfigModal());
        document.getElementById('saveConfig').addEventListener('click', () => this.saveConfiguration());
        document.getElementById('testConnection').addEventListener('click', () => this.testConnection());
        document.getElementById('networkSelect').addEventListener('change', (e) => this.toggleCustomNetwork(e));

        // Forms
        document.getElementById('depositForm').addEventListener('submit', (e) => this.handleDeposit(e));
        document.getElementById('tradeForm').addEventListener('submit', (e) => this.handleTrade(e));
        document.getElementById('orderForm').addEventListener('submit', (e) => this.handleOrder(e));

        // Position type toggles
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.togglePositionType(e));
        });

        document.querySelectorAll('.order-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleOrderType(e));
        });

        // Leverage slider
        document.getElementById('leverage').addEventListener('input', (e) => {
            document.getElementById('leverageValue').textContent = e.target.value;
            this.updatePositionSummary();
        });

        // Position size input
        document.getElementById('positionSize').addEventListener('input', () => {
            this.updatePositionSummary();
            this.updateRiskReward();
        });

        // Stop loss and take profit inputs
        document.getElementById('stopLoss').addEventListener('input', () => {
            this.updateRiskReward();
        });

        document.getElementById('takeProfit').addEventListener('input', () => {
            this.updateRiskReward();
        });

        // Decrypt balance
        document.getElementById('decryptBalance').addEventListener('click', () => this.decryptBalance());

        // Refresh buttons
        document.getElementById('refreshPositions').addEventListener('click', () => this.loadPositions());
        document.getElementById('refreshOrders').addEventListener('click', () => this.loadOrders());
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                // Add active class to clicked tab
                button.classList.add('active');
                const tabName = button.getAttribute('data-tab');
                document.getElementById(`${tabName}Tab`).classList.add('active');
            });
        });
    }

    togglePositionType(e) {
        const buttons = document.querySelectorAll('.position-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        const isLong = e.target.getAttribute('data-type') === 'long';
        document.getElementById('positionType').value = isLong;

        // Recalculate risk/reward ratio when position type changes
        this.updateRiskReward();
    }

    toggleOrderType(e) {
        const buttons = document.querySelectorAll('.order-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        const isBuy = e.target.getAttribute('data-type') === 'buy';
        document.getElementById('orderType').value = isBuy;
    }

    async checkConnection() {
        if (window.ethereum && window.ethereum.selectedAddress) {
            await this.connectWallet();
        }
    }

    async connectWallet() {
        try {
            this.showLoading('Connecting wallet...');

            if (!window.ethereum) {
                alert('Please install MetaMask to use this application!');
                this.hideLoading();
                return;
            }

            // Check network compatibility
            await this.checkNetworkCompatibility();

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Create provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();

            // Create contract instance
            this.contract = new ethers.Contract(
                this.contractAddress,
                CONTRACT_ABI,
                this.signer
            );

            // Update UI
            this.updateWalletUI(true);

            // Initialize FHEVM (mock - actual implementation would use fhevmjs)
            await this.initializeFHEVM();

            // Load user data
            await this.loadUserData();

            // Setup event listeners for contract events
            this.setupContractListeners();

            this.hideLoading();
            this.showStatus('depositStatus', 'Connected successfully!', 'success');

        } catch (error) {
            console.error('Connection error:', error);
            this.hideLoading();
            alert('Failed to connect wallet: ' + error.message);
        }
    }

    async initializeFHEVM() {
        // Mock FHEVM initialization
        // In production, this would use the actual fhevmjs library
        this.showLoading('Initializing FHE encryption...');

        // Simulating initialization delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        this.fhevmInstance = {
            // Mock encryption function
            encrypt64: async (value) => {
                // In production, this would actually encrypt the value
                // For now, we'll just convert it to bytes
                const scaled = Math.floor(value * 100); // Scale to 2 decimals
                const hex = scaled.toString(16).padStart(16, '0');
                return ethers.utils.hexlify('0x' + hex);
            }
        };

        console.log('✅ FHE encryption initialized (mock mode)');
    }

    disconnectWallet() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.fhevmInstance = null;
        this.userAddress = null;
        this.updateWalletUI(false);
    }

    updateWalletUI(connected) {
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        const networkStatus = document.getElementById('networkStatus');
        const networkName = document.getElementById('networkName');

        if (connected) {
            connectBtn.classList.add('hidden');
            walletInfo.classList.remove('hidden');
            networkStatus.classList.add('connected');

            const shortAddress = this.userAddress.substring(0, 6) + '...' + this.userAddress.substring(38);
            document.getElementById('walletAddress').textContent = shortAddress;

            networkName.textContent = 'Zama Devnet';
        } else {
            connectBtn.classList.remove('hidden');
            walletInfo.classList.add('hidden');
            networkStatus.classList.remove('connected');
            networkName.textContent = 'Not Connected';
        }
    }

    async loadUserData() {
        await this.loadBalance();
        await this.loadPositions();
        await this.loadOrders();
    }

    async loadBalance() {
        try {
            const encryptedBalance = await this.contract.getBalance();
            // Display encrypted balance (can't actually decrypt in this demo)
            document.getElementById('encryptedBalance').textContent = '🔒 Encrypted';
        } catch (error) {
            console.error('Error loading balance:', error);
        }
    }

    async decryptBalance() {
        // In production, this would decrypt the balance using FHE
        // For demo purposes, we'll show a placeholder
        alert('In production, this would decrypt your balance using your private key.\n\nBalance decryption requires:\n- FHE decryption key\n- Oracle service for decryption\n- Zero-knowledge proof verification');
    }

    async handleDeposit(e) {
        e.preventDefault();

        try {
            const amount = parseFloat(document.getElementById('depositAmount').value);

            if (!amount || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }

            this.showLoading('Encrypting amount...');
            this.showStatus('depositStatus', '🔒 Encrypting your deposit amount...', '');

            // Encrypt the amount
            const encryptedAmount = await this.fhevmInstance.encrypt64(amount);

            this.showLoading('Sending transaction...');
            this.showStatus('depositStatus', '📤 Sending transaction to blockchain...', '');

            // Send deposit transaction
            const tx = await this.contract.deposit(encryptedAmount);

            this.showStatus('depositStatus', '⏳ Waiting for confirmation...', '');

            await tx.wait();

            this.hideLoading();
            this.showStatus('depositStatus', `✅ Successfully deposited ${amount} USDC (encrypted)`, 'success');

            // Reset form
            document.getElementById('depositForm').reset();

            // Reload balance
            await this.loadBalance();

        } catch (error) {
            console.error('Deposit error:', error);
            this.hideLoading();
            this.showStatus('depositStatus', '❌ Deposit failed: ' + error.message, 'error');
        }
    }

    async handleTrade(e) {
        e.preventDefault();

        try {
            const size = parseFloat(document.getElementById('positionSize').value);
            const leverage = parseInt(document.getElementById('leverage').value);
            const isLong = document.getElementById('positionType').value === 'true';
            const stopLoss = parseFloat(document.getElementById('stopLoss').value) || 0;
            const takeProfit = parseFloat(document.getElementById('takeProfit').value) || 0;

            if (!size || size <= 0) {
                alert('Please enter a valid position size');
                return;
            }

            // Validate stop loss and take profit logic
            const mockPrice = 50000;
            if (stopLoss > 0) {
                if (isLong && stopLoss >= mockPrice) {
                    alert('Stop loss for LONG position must be below current price');
                    return;
                }
                if (!isLong && stopLoss <= mockPrice) {
                    alert('Stop loss for SHORT position must be above current price');
                    return;
                }
            }

            if (takeProfit > 0) {
                if (isLong && takeProfit <= mockPrice) {
                    alert('Take profit for LONG position must be above current price');
                    return;
                }
                if (!isLong && takeProfit >= mockPrice) {
                    alert('Take profit for SHORT position must be below current price');
                    return;
                }
            }

            this.showLoading('Encrypting position data...');
            this.showStatus('tradeStatus', '🔒 Encrypting position size, stop loss, and take profit...', '');

            // Encrypt the position size, stop loss, and take profit
            const encryptedSize = await this.fhevmInstance.encrypt64(size);
            const encryptedStopLoss = await this.fhevmInstance.encrypt64(stopLoss);
            const encryptedTakeProfit = await this.fhevmInstance.encrypt64(takeProfit);

            this.showLoading('Opening position...');
            this.showStatus('tradeStatus', `📤 Opening ${isLong ? 'LONG' : 'SHORT'} position with risk management...`, '');

            // Open position with stop loss and take profit
            const tx = await this.contract.openPosition(
                encryptedSize,
                leverage,
                isLong,
                encryptedStopLoss,
                encryptedTakeProfit
            );

            this.showStatus('tradeStatus', '⏳ Waiting for confirmation...', '');

            const receipt = await tx.wait();

            // Extract position ID from events
            const event = receipt.events.find(e => e.event === 'PositionOpened');
            const positionId = event?.args?.positionId || 'Unknown';

            this.hideLoading();

            let successMessage = `✅ Position opened successfully!\nPosition ID: ${positionId.substring(0, 10)}...`;
            if (stopLoss > 0 || takeProfit > 0) {
                successMessage += '\n🛡️ Risk management active';
            }

            this.showStatus('tradeStatus', successMessage, 'success');

            // Reset form
            document.getElementById('tradeForm').reset();
            document.getElementById('leverageValue').textContent = '5';

            // Reload positions
            await this.loadPositions();

        } catch (error) {
            console.error('Trade error:', error);
            this.hideLoading();
            this.showStatus('tradeStatus', '❌ Failed to open position: ' + error.message, 'error');
        }
    }

    async handleOrder(e) {
        e.preventDefault();

        try {
            const price = parseFloat(document.getElementById('orderPrice').value);
            const size = parseFloat(document.getElementById('orderSize').value);
            const isBuy = document.getElementById('orderType').value === 'true';

            if (!price || price <= 0 || !size || size <= 0) {
                alert('Please enter valid price and size');
                return;
            }

            this.showLoading('Encrypting order data...');
            this.showStatus('orderStatus', '🔒 Encrypting order price and size...', '');

            // Encrypt price and size
            const encryptedPrice = await this.fhevmInstance.encrypt64(price);
            const encryptedSize = await this.fhevmInstance.encrypt64(size);

            this.showLoading('Placing order...');
            this.showStatus('orderStatus', `📤 Placing ${isBuy ? 'BUY' : 'SELL'} order...`, '');

            // Place order
            const tx = await this.contract.placeOrder(encryptedPrice, encryptedSize, isBuy);

            this.showStatus('orderStatus', '⏳ Waiting for confirmation...', '');

            const receipt = await tx.wait();

            // Extract order ID from events
            const event = receipt.events.find(e => e.event === 'OrderPlaced');
            const orderId = event?.args?.orderId?.toString() || 'Unknown';

            this.hideLoading();
            this.showStatus('orderStatus',
                `✅ Order placed successfully!\nOrder ID: ${orderId}`,
                'success'
            );

            // Reset form
            document.getElementById('orderForm').reset();

            // Reload orders
            await this.loadOrders();

        } catch (error) {
            console.error('Order error:', error);
            this.hideLoading();
            this.showStatus('orderStatus', '❌ Failed to place order: ' + error.message, 'error');
        }
    }

    async loadPositions() {
        if (!this.contract || !this.userAddress) return;

        try {
            const positionIds = await this.contract.getUserPositions(this.userAddress);

            const positionsList = document.getElementById('positionsList');

            if (positionIds.length === 0) {
                positionsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📊</div>
                        <p>No open positions</p>
                        <small>Open a position in the Trade tab</small>
                    </div>
                `;
                return;
            }

            // Render positions
            positionsList.innerHTML = positionIds.map((id, index) => `
                <div class="position-item">
                    <div class="position-header">
                        <div>
                            <strong>Position #${index + 1}</strong>
                            <div class="position-badge long">LONG</div>
                        </div>
                        <div>
                            <small>ID: ${id.substring(0, 10)}...</small>
                        </div>
                    </div>
                    <div class="position-details">
                        <div class="position-detail">
                            <span class="detail-label">Size</span>
                            <span class="detail-value">🔒 Encrypted</span>
                        </div>
                        <div class="position-detail">
                            <span class="detail-label">Entry Price</span>
                            <span class="detail-value">🔒 Encrypted</span>
                        </div>
                        <div class="position-detail">
                            <span class="detail-label">Collateral</span>
                            <span class="detail-value">🔒 Encrypted</span>
                        </div>
                        <div class="position-detail">
                            <span class="detail-label">PnL</span>
                            <span class="detail-value text-success">🔒 Encrypted</span>
                        </div>
                    </div>
                    <div class="position-actions">
                        <button class="btn btn-sm btn-danger" onclick="app.closePosition('${id}')">
                            Close Position
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading positions:', error);
        }
    }

    async closePosition(positionId) {
        if (!confirm('Are you sure you want to close this position?')) return;

        try {
            this.showLoading('Closing position...');

            const tx = await this.contract.closePosition(positionId);
            await tx.wait();

            this.hideLoading();
            alert('Position closed successfully!');

            await this.loadPositions();
            await this.loadBalance();

        } catch (error) {
            console.error('Error closing position:', error);
            this.hideLoading();
            alert('Failed to close position: ' + error.message);
        }
    }

    async loadOrders() {
        if (!this.contract) return;

        try {
            const orderBookSize = await this.contract.getOrderBookSize();

            document.getElementById('totalOrders').textContent = orderBookSize.toString();
            document.getElementById('buyOrders').textContent = '🔒';
            document.getElementById('sellOrders').textContent = '🔒';

            const ordersList = document.getElementById('ordersList');

            if (orderBookSize.toNumber() === 0) {
                ordersList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <p>No orders in the book</p>
                        <small>Place an order in the Trade tab</small>
                    </div>
                `;
                return;
            }

            // In production, you'd fetch actual order details
            // For now, show placeholder
            ordersList.innerHTML = `
                <div class="order-item">
                    <div class="order-info">
                        <span class="order-type buy">BUY</span>
                        <div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                Price: 🔒 Encrypted | Size: 🔒 Encrypted
                            </div>
                        </div>
                    </div>
                    <div>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Order #1</span>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    updatePositionSummary() {
        const size = parseFloat(document.getElementById('positionSize').value) || 0;
        const leverage = parseInt(document.getElementById('leverage').value) || 1;
        const mockPrice = 50000; // Mock BTC price

        const positionValue = size * mockPrice;
        const requiredCollateral = positionValue / leverage;

        document.getElementById('positionValue').textContent =
            `$${positionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('requiredCollateral').textContent =
            `$${requiredCollateral.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    updateRiskReward() {
        const mockPrice = 50000; // Mock BTC price
        const stopLoss = parseFloat(document.getElementById('stopLoss').value) || 0;
        const takeProfit = parseFloat(document.getElementById('takeProfit').value) || 0;
        const isLong = document.getElementById('positionType').value === 'true';

        const ratioEl = document.getElementById('riskRewardRatio');

        if (stopLoss === 0 && takeProfit === 0) {
            ratioEl.textContent = '--';
            ratioEl.style.color = 'var(--text-secondary)';
            return;
        }

        if (stopLoss === 0 || takeProfit === 0) {
            ratioEl.textContent = stopLoss === 0 ? 'No SL' : 'No TP';
            ratioEl.style.color = 'var(--warning-color)';
            return;
        }

        let risk, reward;
        if (isLong) {
            risk = mockPrice - stopLoss;
            reward = takeProfit - mockPrice;
        } else {
            risk = stopLoss - mockPrice;
            reward = mockPrice - takeProfit;
        }

        if (risk <= 0 || reward <= 0) {
            ratioEl.textContent = 'Invalid';
            ratioEl.style.color = 'var(--danger-color)';
            return;
        }

        const ratio = reward / risk;
        ratioEl.textContent = `1:${ratio.toFixed(2)}`;

        // Color code based on ratio quality
        if (ratio >= 2) {
            ratioEl.style.color = 'var(--success-color)'; // Good ratio
        } else if (ratio >= 1) {
            ratioEl.style.color = 'var(--warning-color)'; // Acceptable
        } else {
            ratioEl.style.color = 'var(--danger-color)'; // Poor ratio
        }
    }

    setupContractListeners() {
        // Listen for position events
        this.contract.on('PositionOpened', (trader, positionId, isLong) => {
            if (trader.toLowerCase() === this.userAddress.toLowerCase()) {
                console.log('Position opened:', positionId);
                this.loadPositions();
            }
        });

        this.contract.on('PositionClosed', (trader, positionId) => {
            if (trader.toLowerCase() === this.userAddress.toLowerCase()) {
                console.log('Position closed:', positionId);
                this.loadPositions();
            }
        });

        this.contract.on('OrderPlaced', (trader, orderId, isLong) => {
            if (trader.toLowerCase() === this.userAddress.toLowerCase()) {
                console.log('Order placed:', orderId);
                this.loadOrders();
            }
        });

        this.contract.on('BalanceDeposited', (user, amount) => {
            if (user.toLowerCase() === this.userAddress.toLowerCase()) {
                console.log('Balance deposited');
                this.loadBalance();
            }
        });
    }

    openConfigModal() {
        // Populate current values
        const currentAddress = localStorage.getItem('contract_address') || '';
        document.getElementById('contractAddressInput').value = currentAddress;
        document.getElementById('currentContract').textContent = currentAddress || 'Not set';

        // Show modal
        document.getElementById('configModal').classList.remove('hidden');
    }

    closeConfigModal() {
        document.getElementById('configModal').classList.add('hidden');
    }

    toggleCustomNetwork(e) {
        const customFields = document.getElementById('customNetworkFields');
        if (e.target.value === 'custom') {
            customFields.classList.remove('hidden');
        } else {
            customFields.classList.add('hidden');
        }
    }

    async testConnection() {
        const address = document.getElementById('contractAddressInput').value;

        if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
            alert('Please enter a valid contract address');
            return;
        }

        try {
            this.showLoading('Testing connection...');
            const statusBadge = document.getElementById('contractStatus');

            // Check if MetaMask is connected
            if (!window.ethereum) {
                statusBadge.className = 'status-badge status-error';
                statusBadge.textContent = 'MetaMask not found';
                this.hideLoading();
                return;
            }

            // Try to get network
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();

            // Try to get contract code
            const code = await provider.getCode(address);

            if (code === '0x') {
                statusBadge.className = 'status-badge status-error';
                statusBadge.textContent = 'No contract at address';
            } else {
                statusBadge.className = 'status-badge status-connected';
                statusBadge.textContent = `Connected (Chain: ${network.chainId})`;
            }

            this.hideLoading();
        } catch (error) {
            console.error('Connection test error:', error);
            const statusBadge = document.getElementById('contractStatus');
            statusBadge.className = 'status-badge status-error';
            statusBadge.textContent = 'Connection failed';
            this.hideLoading();
            alert('Connection test failed: ' + error.message);
        }
    }

    saveConfiguration() {
        const address = document.getElementById('contractAddressInput').value;

        if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
            alert('Please enter a valid contract address');
            return;
        }

        // Save to localStorage
        localStorage.setItem('contract_address', address);
        this.contractAddress = address;

        // Update UI
        document.getElementById('currentContract').textContent = address;

        // Show success message
        alert('Configuration saved! Please reconnect your wallet to apply changes.');

        // Close modal
        this.closeConfigModal();

        // Hide demo banner if contract is configured
        if (address !== '0x0000000000000000000000000000000000000000') {
            const demoBanner = document.getElementById('demoBanner');
            demoBanner.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)';
            demoBanner.style.borderColor = 'var(--success-color)';
            demoBanner.querySelector('.banner-text').innerHTML = '<strong>Ready!</strong> Contract configured. Connect your wallet to start trading.';
        }
    }

    async checkNetworkCompatibility() {
        if (!window.ethereum) return;

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            const expectedChainId = 9000; // Zama devnet

            if (network.chainId !== expectedChainId) {
                const switchNetwork = confirm(
                    `You're connected to chain ${network.chainId}.\n` +
                    `This app requires Zama Devnet (Chain ID: ${expectedChainId}).\n\n` +
                    `Would you like to switch networks?`
                );

                if (switchNetwork) {
                    await this.switchToZamaNetwork();
                }
            }
        } catch (error) {
            console.error('Network check error:', error);
        }
    }

    async switchToZamaNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x2328' }], // 9000 in hex
            });
        } catch (switchError) {
            // Network doesn't exist, try to add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x2328',
                            chainName: 'Zama Devnet',
                            nativeCurrency: {
                                name: 'ZAMA',
                                symbol: 'ZAMA',
                                decimals: 18
                            },
                            rpcUrls: ['https://devnet.zama.ai'],
                            blockExplorerUrls: ['https://explorer.devnet.zama.ai']
                        }],
                    });
                } catch (addError) {
                    console.error('Error adding network:', addError);
                    alert('Failed to add Zama network. Please add it manually in MetaMask.');
                }
            } else {
                console.error('Error switching network:', switchError);
            }
        }
    }

    showLoading(message) {
        const overlay = document.getElementById('loadingOverlay');
        const messageEl = document.getElementById('loadingMessage');
        messageEl.textContent = message;
        overlay.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    showStatus(elementId, message, type = '') {
        const statusEl = document.getElementById(elementId);
        const messageEl = statusEl.querySelector('.status-message');

        statusEl.classList.remove('hidden', 'success', 'error');
        if (type) statusEl.classList.add(type);

        messageEl.textContent = message;
    }
}

// Initialize app when DOM is ready
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new ConfidentialPerpDEXApp();
        window.app = app; // Make available globally for button onclick
    });
} else {
    app = new ConfidentialPerpDEXApp();
    window.app = app;
}

export default ConfidentialPerpDEXApp;
