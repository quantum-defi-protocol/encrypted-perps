# 🚀 Quick Start Guide - Confidential Perp DEX

Get your privacy-preserving perpetual futures DEX up and running in minutes!

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ MetaMask browser extension
- ✅ Python 3 (for development server)
- ✅ Git (to clone the repository)

## 🎯 Step-by-Step Setup

### 1. Install Dependencies

```bash
cd confidential-perp-dex
npm install
```

This installs:
- Hardhat for smart contract development
- Ethers.js for blockchain interaction
- fhevmjs for FHE encryption
- Development tools

### 2. Configure Environment

The `.env` file is already configured with:

```env
RPC_URL=https://devnet.zama.ai
CHAIN_ID=8009
PRIVATE_KEY=0xff3985ec4f2bbee115277ff8d2ba58f58ce92459a6c3ba888a12f2dc3c19b326
CONTRACT_ADDRESS=
ETHERSCAN_API_KEY=2AUUKSFAADVUIGFZWADW4RPZNYD9B471VK
```

**⚠️ Important**:
- The private key is a demo key - DO NOT use with real funds
- Update `CONTRACT_ADDRESS` after deployment

### 3. Compile Smart Contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 3 Solidity files successfully (evm target: cancun)
```

### 4. Deploy Contract

**Note**: Deployment requires a valid Zama devnet RPC URL. If the default doesn't work:

```bash
# Update RPC_URL in .env with the correct endpoint
# Then deploy:
npm run deploy
```

**Alternative**: Use a local test network:

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy locally
npx hardhat run scripts/deploy.cjs --network localhost
```

After successful deployment, copy the contract address and update `.env`:

```env
CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 5. Start the Frontend

```bash
npm run dev
```

This starts a local server at `http://localhost:3000`

Open your browser and navigate to the URL!

## 🌐 Using the Application

### Connect Your Wallet

1. Click **"Connect Wallet"** in the top right
2. Approve the MetaMask connection
3. Your address will appear in the header

### Make Your First Deposit

1. Go to the **"Deposit"** tab
2. Enter an amount (e.g., 1000)
3. Click **"🔒 Encrypt & Deposit"**
4. Confirm in MetaMask
5. Wait for confirmation

**Privacy**: Your deposit amount is encrypted! ✨

### Open Your First Position

1. Go to the **"Trade"** tab
2. Select **LONG** or **SHORT**
3. Enter position size (e.g., 0.1)
4. Adjust leverage with the slider
5. Click **"🔒 Encrypt & Open Position"**
6. Confirm in MetaMask

**Privacy**: Position size is encrypted! 🔐

### View Your Positions

1. Go to the **"Positions"** tab
2. See all open positions
3. Click **"Close Position"** to exit
4. Details update automatically

### Place a Limit Order

1. In the **"Trade"** tab, scroll to "Place Limit Order"
2. Select **BUY** or **SELL**
3. Enter price and size
4. Click **"🔒 Encrypt & Place Order"**
5. Confirm in MetaMask

**Privacy**: Both price and size are encrypted! 🎯

## 🛠️ Running Examples

### Integration Guide

```bash
node examples/integration-guide.js
```

Shows complete SDK usage workflow.

### Trading Bot Example

```bash
node examples/library-example.js
```

Demonstrates automated trading bot implementation.

### Liquidation Bot

```bash
npm run bot
```

Runs the automated liquidation monitor.

## 📱 Frontend Overview

### Main Sections

1. **Header**
   - Wallet connection status
   - Network indicator
   - Wallet address display

2. **Sidebar Navigation**
   - Deposit funds
   - Trade positions
   - View positions
   - View orders

3. **Account Info**
   - Encrypted balance display
   - Decrypt button (demo)

4. **Trading Interface**
   - Position type selector
   - Leverage slider
   - Position summary
   - Real-time calculations

5. **Order Book**
   - Total orders
   - Buy/sell statistics
   - Encrypted order details

## 🔐 Understanding Privacy

### What's Encrypted (Private)

- ✅ User balances
- ✅ Position sizes
- ✅ Entry prices
- ✅ Collateral amounts
- ✅ Order prices
- ✅ Order sizes
- ✅ PnL calculations

### What's Public

- ❌ Wallet addresses
- ❌ Position direction (long/short)
- ❌ Leverage levels
- ❌ Order type (buy/sell)
- ❌ Timestamps
- ❌ Position IDs

## 🐛 Troubleshooting

### Contract Compilation Errors

**Problem**: Division or encryption errors

**Solution**: The contract uses the available fhevm API. Review `README.md` FHE Limitations section.

### Network Connection Issues

**Problem**: Cannot connect to Zama devnet

**Solutions**:
1. Check RPC_URL in `.env`
2. Try a local hardhat network instead
3. Contact Zama for current devnet status

### Frontend Not Loading

**Problem**: Blank page or errors

**Solutions**:
1. Check browser console for errors
2. Ensure Python HTTP server is running
3. Try a different port: `python3 -m http.server 3001 --directory public`
4. Clear browser cache

### MetaMask Issues

**Problem**: Wallet won't connect

**Solutions**:
1. Unlock MetaMask
2. Refresh the page
3. Check you're on the correct network
4. Try reconnecting

### Transaction Failures

**Problem**: Transactions revert or fail

**Solutions**:
1. Ensure contract is deployed
2. Check you have sufficient balance
3. Verify contract address in frontend
4. Review browser console for errors

## 📚 Next Steps

### Learn More

1. **Read the Documentation**
   - `README.md` - Full project documentation
   - `public/README.md` - Frontend-specific docs
   - `contracts/ConfidentialPerpDEX.sol` - Smart contract code

2. **Explore the Code**
   - `src/perp-dex-sdk.js` - SDK implementation
   - `public/js/app.js` - Frontend logic
   - `examples/` - Usage examples

3. **Understand FHE Limitations**
   - See README.md "FHE Integration & Limitations" section
   - Learn about encrypted operations
   - Understand privacy trade-offs

### Customize the Project

1. **Modify Frontend Design**
   - Edit `public/css/styles.css`
   - Change colors, layout, fonts
   - Add new components

2. **Extend Smart Contract**
   - Add new features
   - Implement additional order types
   - Enhanced liquidation logic

3. **Build Trading Strategies**
   - Use the SDK in `src/perp-dex-sdk.js`
   - Create automated trading bots
   - Implement risk management

## 🎓 Understanding the Tech Stack

### Smart Contracts
- **Solidity 0.8.24** - Contract language
- **fhEVM** - Fully homomorphic encryption
- **TFHE.sol** - FHE operations library

### Frontend
- **Vanilla JavaScript** - No frameworks
- **Ethers.js** - Blockchain interaction
- **CSS Grid/Flexbox** - Responsive layout
- **Web3 Provider** - Wallet integration

### Development Tools
- **Hardhat** - Smart contract development
- **Node.js** - JavaScript runtime
- **Python HTTP Server** - Local development

## ⚠️ Important Reminders

### Security

- 🔴 **DO NOT** use the demo private key with real funds
- 🔴 **DO NOT** deploy to mainnet without security audit
- 🟡 **ALWAYS** verify transaction details before signing
- 🟢 **USE** hardware wallets in production

### Privacy

- The current implementation is a **proof-of-concept**
- Real FHE encryption requires additional infrastructure
- Some operations have limitations (see README.md)
- Production requires decryption oracles

### Testing

- Use Zama devnet for testing only
- Test all features before real deployment
- Monitor gas costs
- Check contract events in block explorer

## 🆘 Getting Help

### Resources

- **Documentation**: See README.md
- **Code Examples**: Check `examples/` directory
- **Zama Docs**: https://docs.zama.ai/fhevm
- **Ethers.js Docs**: https://docs.ethers.io/

### Common Issues

1. **"Contract not deployed"**
   - Run `npm run deploy` first
   - Update CONTRACT_ADDRESS in .env

2. **"Insufficient balance"**
   - Get testnet tokens
   - Check wallet has funds

3. **"Transaction failed"**
   - Increase gas limit
   - Check contract state
   - Verify parameters

4. **"Encryption error"**
   - Current version uses mock encryption
   - Check console for details
   - Review app.js implementation

## 🎉 Success Checklist

- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Contracts compiled successfully
- [ ] Contract deployed (or using local network)
- [ ] Contract address updated in .env
- [ ] Frontend server running
- [ ] Wallet connected
- [ ] First deposit made
- [ ] Position opened successfully
- [ ] Frontend displays data correctly

## 📈 What's Next?

Now that you're set up, you can:

1. **Explore Privacy Features**
   - Test encrypted deposits
   - Open various positions
   - Place limit orders
   - Monitor the order book

2. **Run the Examples**
   - Try the integration guide
   - Run the trading bot
   - Start the liquidation bot

3. **Customize & Extend**
   - Modify the frontend design
   - Add new trading features
   - Implement strategies
   - Build on the SDK

4. **Learn About FHE**
   - Read Zama documentation
   - Understand limitations
   - Explore use cases
   - Join the community

---

**🚀 Happy Trading with Privacy!**

*Remember: This is a proof-of-concept. Always audit code before production use.*
