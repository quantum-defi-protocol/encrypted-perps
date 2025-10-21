# Deployment Guide

Complete guide for deploying the Confidential Perp DEX to different networks.

## Quick Deploy

### Deploy to Sepolia (Recommended for Testing)

```bash
# 1. Ensure you have Sepolia ETH in your wallet
# Get free Sepolia ETH from: https://sepoliafaucet.com/

# 2. Deploy
npm run deploy:sepolia

# 3. Copy the deployed contract address and update .env
CONTRACT_ADDRESS=0xYourDeployedAddress
```

### Deploy to Local Network

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy to local network
npm run deploy:local
```

### Deploy to Zama Devnet (When Available)

```bash
npm run deploy
```

---

## Detailed Deployment Steps

### Prerequisites

1. **Wallet Funded**
   - For Sepolia: Get test ETH from https://sepoliafaucet.com/
   - For local: Hardhat provides funded accounts automatically
   - For Zama: Get devnet tokens from Zama

2. **Environment Configured**
   - `.env` file with `PRIVATE_KEY` set
   - RPC URLs configured
   - Etherscan API key (optional, for verification)

3. **Dependencies Installed**
   ```bash
   npm install
   ```

4. **Contracts Compiled**
   ```bash
   npx hardhat compile
   ```

---

## Network-Specific Instructions

### Sepolia Testnet

**Features:**
- ✅ Public Ethereum testnet
- ✅ Free test ETH available
- ✅ Etherscan verification supported
- ❌ No FHE support (encrypted types work as regular uint256)

**Step-by-Step:**

1. **Get Sepolia ETH**
   ```
   Visit: https://sepoliafaucet.com/
   Enter your wallet address
   Claim test ETH
   ```

2. **Configure RPC** (already done in `.env`)
   ```bash
   SEPOLIA_RPC_URL=https://rpc.sepolia.org
   ```

3. **Deploy**
   ```bash
   npm run deploy:sepolia
   ```

4. **Expected Output:**
   ```
   🚀 Deploying ConfidentialPerpDEX...
   Downloading compiler 0.8.24
   Compiled 3 Solidity files successfully
   ✅ Deployed to: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1

   Add to .env:
   CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
   ```

5. **Update Configuration**
   ```bash
   # In .env
   CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
   ```

6. **Verify on Etherscan** (optional)
   ```bash
   npx hardhat verify --network sepolia 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
   ```

7. **View on Sepolia Etherscan**
   ```
   https://sepolia.etherscan.io/address/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
   ```

**⚠️ Important Notes:**
- Encrypted types behave as regular `uint256` on Sepolia
- No real FHE encryption happens
- Useful for testing contract logic and frontend
- NOT suitable for privacy testing

---

### Local Hardhat Network

**Features:**
- ✅ Fast deployment
- ✅ Free (no gas costs)
- ✅ Pre-funded accounts
- ✅ Console logging support
- ❌ No FHE support
- ❌ Network resets on restart

**Step-by-Step:**

1. **Start Local Node** (Terminal 1)
   ```bash
   npx hardhat node
   ```

   Output shows 20 pre-funded accounts:
   ```
   Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

   Accounts
   ========
   Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ...
   ```

2. **Deploy** (Terminal 2)
   ```bash
   npm run deploy:local
   ```

3. **Update Frontend**
   The contract deploys to a deterministic address (usually the same each time):
   ```bash
   CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

4. **Connect MetaMask to Local Network**
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

5. **Import Test Account to MetaMask**
   Use one of the private keys shown in the node output

6. **Keep Node Running**
   - Network state resets when node stops
   - Need to redeploy after restart

**Tips:**
- Use for rapid development and testing
- Perfect for frontend development
- Instant transaction confirmation
- Full console.log support in contracts

---

### Zama Devnet (FHE-Enabled)

**Features:**
- ✅ Real FHE encryption
- ✅ Full privacy features
- ✅ Test encrypted operations
- ⚠️ Network may be unavailable
- ⚠️ Requires devnet tokens

**Step-by-Step:**

1. **Check Network Availability**
   ```bash
   curl https://devnet.zama.ai
   ```

2. **Get Devnet Tokens**
   - Visit Zama documentation for faucet
   - Join Zama Discord for support

3. **Configure RPC**
   Update `.env` with current devnet URL:
   ```bash
   RPC_URL=https://devnet.zama.ai
   # Or current valid endpoint from Zama docs
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

5. **Test FHE Operations**
   - All encrypted types work with real FHE
   - Privacy fully preserved
   - Encrypted comparisons functional

**⚠️ Current Status:**
- Devnet URL in config may be outdated
- Check Zama docs for current endpoint
- Use Sepolia for testing if devnet unavailable

---

## Post-Deployment Steps

### 1. Update Contract Address

**In `.env`:**
```bash
CONTRACT_ADDRESS=0xYourDeployedAddress
```

**In Frontend** (if needed):
```javascript
// public/js/app.js - line ~29
loadContractAddress() {
    return localStorage.getItem('contract_address') ||
           '0xYourDeployedAddress';  // Add your address here
}
```

### 2. Verify Deployment

**Check contract is deployed:**
```bash
# Using Hardhat
npx hardhat console --network sepolia
> const contract = await ethers.getContractAt("ConfidentialPerpDEX", "0xYourAddress")
> await contract.admin()
# Should return your deployer address
```

**Or use block explorer:**
- Sepolia: https://sepolia.etherscan.io/address/0xYourAddress
- Local: Check hardhat node logs

### 3. Test Basic Functions

```javascript
// In Hardhat console
const [deployer] = await ethers.getSigners();
const contract = await ethers.getContractAt("ConfidentialPerpDEX", "0xYourAddress");

// Check admin
await contract.admin();
// Should return deployer address

// Check oracle price (encrypted)
await contract.getOraclePrice();
// Returns encrypted value

// Check order book size
await contract.getOrderBookSize();
// Should return 0 initially
```

### 4. Start Frontend

```bash
npm run dev
```

Visit `http://localhost:8080` and connect your wallet.

### 5. Make Test Deposit

1. Connect wallet to same network as deployment
2. Go to Deposit tab
3. Enter amount (e.g., 1000)
4. Click "Encrypt & Deposit"
5. Confirm transaction
6. Wait for confirmation

---

## Troubleshooting Deployment

### "Insufficient funds for intrinsic transaction cost"

**Cause:** Not enough ETH in deployer wallet

**Solution:**
```bash
# Sepolia: Get test ETH
https://sepoliafaucet.com/

# Local: Use pre-funded account
# Check npx hardhat node output for funded accounts
```

### "ENOTFOUND" or "Network error"

**Cause:** RPC URL not reachable

**Solution:**
```bash
# Test RPC connection
curl https://rpc.sepolia.org

# If fails, try alternative RPC:
SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
# or
SEPOLIA_RPC_URL=https://rpc.sepolia.ethpandaops.io
```

### "Nonce too high"

**Cause:** MetaMask/wallet has incorrect nonce

**Solution:**
```bash
# Reset MetaMask account
Settings > Advanced > Clear activity tab data

# Or use different account
# Or wait and retry
```

### "Contract creation code storage out of gas"

**Cause:** Contract too large or gas limit too low

**Solution:**
```bash
# Increase gas limit in deployment
# In scripts/deploy.cjs, add:
const dex = await ConfidentialPerpDEX.deploy({
    gasLimit: 10000000
});
```

### Compilation Errors

**See:** `KNOWN_ISSUES.md` for all compilation fixes

**Quick check:**
```bash
npx hardhat clean
npx hardhat compile
```

---

## Network Comparison

| Feature | Sepolia | Local | Zama Devnet |
|---------|---------|-------|-------------|
| FHE Support | ❌ No | ❌ No | ✅ Yes |
| Cost | Free (testnet) | Free | Free (testnet) |
| Speed | ~12s blocks | Instant | ~12s blocks |
| Persistence | ✅ Permanent | ❌ Resets | ✅ Permanent |
| Public Access | ✅ Yes | ❌ Local only | ✅ Yes |
| Etherscan | ✅ Yes | ❌ No | ⚠️ Limited |
| Best For | Frontend testing | Development | FHE testing |

---

## Contract Verification

### Verify on Sepolia Etherscan

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

**If constructor has arguments:**
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> \
  --constructor-args arguments.js
```

**For complex verification:**
```javascript
// Create arguments.js
module.exports = [
  // Constructor arguments here
];
```

### Manual Verification

If automatic verification fails:

1. Get compiler input:
   ```bash
   npx hardhat flatten contracts/ConfidentialPerpDEX.sol > flattened.sol
   ```

2. Visit Etherscan contract page

3. Click "Verify and Publish"

4. Select:
   - Compiler: v0.8.24
   - Optimization: Yes (200 runs)
   - EVM Version: cancun

5. Paste flattened contract code

6. Submit for verification

---

## Deployment Checklist

### Pre-Deployment
- [ ] Dependencies installed (`npm install`)
- [ ] Contracts compile (`npx hardhat compile`)
- [ ] `.env` configured with private key
- [ ] Wallet funded with test ETH
- [ ] Network RPC URL verified

### Deployment
- [ ] Deployed successfully
- [ ] Contract address obtained
- [ ] Deployment transaction confirmed
- [ ] No error messages

### Post-Deployment
- [ ] Contract address updated in `.env`
- [ ] Contract address added to frontend
- [ ] Deployment verified on block explorer
- [ ] Basic contract functions tested
- [ ] Frontend connects successfully
- [ ] Test transaction executed

### Optional
- [ ] Contract verified on Etherscan
- [ ] Documentation updated
- [ ] Team notified of new deployment

---

## Multiple Environment Setup

To deploy to multiple networks simultaneously:

```bash
# Deploy to Sepolia
npm run deploy:sepolia
# Note the address: 0xSepoliaAddress

# Deploy to localhost (in another terminal)
npx hardhat node  # Terminal 1
npm run deploy:local  # Terminal 2
# Note the address: 0xLocalhostAddress
```

**Configure frontend for multiple networks:**

```javascript
// public/js/app.js
const CONTRACTS = {
  11155111: '0xSepoliaAddress',  // Sepolia
  31337: '0xLocalhostAddress',    // Localhost
  8009: '0xZamaAddress'           // Zama (when available)
};

loadContractAddress() {
  const chainId = await this.provider.getNetwork().then(n => n.chainId);
  return CONTRACTS[chainId] || localStorage.getItem('contract_address');
}
```

---

## Gas Optimization

Current contract deployment gas cost (Sepolia):
- ~2,500,000 gas
- ~0.0025 ETH at 1 gwei gas price

**To reduce:**
1. Optimizer already enabled (200 runs)
2. Use larger runs for frequently called functions:
   ```javascript
   optimizer: { enabled: true, runs: 1000 }
   ```
3. Consider using proxy pattern for upgrades

---

## Security Checklist

Before mainnet (if ever):
- [ ] Full security audit
- [ ] Penetration testing
- [ ] FHE encryption audit
- [ ] Access control review
- [ ] Economic security analysis
- [ ] Bug bounty program
- [ ] Testnet testing period (min 1 month)
- [ ] Admin key management
- [ ] Upgrade mechanism review
- [ ] Emergency pause functionality

---

## Support & Resources

**Documentation:**
- This file - Deployment guide
- `KNOWN_ISSUES.md` - Troubleshooting
- `QUICKSTART.md` - Quick setup
- `README.md` - Full documentation

**External Resources:**
- Hardhat Docs: https://hardhat.org/docs
- Sepolia Faucet: https://sepoliafaucet.com/
- Etherscan Sepolia: https://sepolia.etherscan.io/
- Zama Docs: https://docs.zama.ai/

**Get Help:**
- Check `KNOWN_ISSUES.md` first
- Review console output for specific errors
- Test on local network first
- Ask in project repository issues

---

**Last Updated:** Based on successful Sepolia deployment testing
**Network Status:** Sepolia ✅ | Local ✅ | Zama ⚠️ (check current status)
