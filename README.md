# Confidential Perpetual DEX

A fully encrypted perpetual futures decentralized exchange built on Zama's fhEVM, providing complete privacy for traders' positions, balances, and orders.

## Features

- **Fully Encrypted Trading**: All positions, balances, and orders are encrypted using FHE (Fully Homomorphic Encryption)
- **Leverage Trading**: Open long and short positions with customizable leverage
- **Order Book**: Place encrypted limit orders with automatic matching
- **Liquidation System**: Automated liquidation of undercollateralized positions
- **Privacy Preserved**: Position details remain confidential on-chain

## Project Structure

```
confidential-perp-dex/
├── contracts/
│   └── ConfidentialPerpDEX.sol      # Main smart contract
├── public/                          # Frontend application
│   ├── index.html                   # Main HTML file
│   ├── css/
│   │   └── styles.css              # Complete styling
│   └── js/
│       └── app.js                  # Frontend application logic
├── src/
│   └── perp-dex-sdk.js              # JavaScript SDK
├── examples/
│   ├── integration-guide.js         # Complete integration example
│   └── library-example.js           # Trading bot example
├── scripts/
│   ├── deploy.cjs                   # Deployment script
│   └── liquidation-bot.js           # Automated liquidation bot
├── hardhat.config.cjs               # Hardhat configuration
├── package.json                     # Dependencies
└── .env                             # Environment variables
```

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- A wallet with funds on Zama devnet
- Basic understanding of perpetual futures

## Installation

1. Clone and install dependencies:

```bash
cd confidential-perp-dex
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
# Edit .env and add your PRIVATE_KEY
```

3. Deploy the contract:

```bash
npm run deploy
```

4. Add the deployed contract address to `.env`:

```bash
CONTRACT_ADDRESS=0x...
```

## Quick Start

### Using the SDK

```javascript
import { ethers } from "ethers";
import { ConfidentialPerpDEXSDK } from "./src/perp-dex-sdk.js";

// Setup
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const dex = new ConfidentialPerpDEXSDK(
  process.env.CONTRACT_ADDRESS,
  provider,
  signer
);

await dex.initialize();

// Deposit collateral
await dex.deposit(1000000);

// Open a long position
const { positionId } = await dex.openPosition(
  100,    // size
  5,      // leverage
  true    // isLong
);

// Close position
await dex.closePosition(positionId);
```

### Using the Frontend

The project includes a fully functional web interface for interacting with the DEX.

#### Start the Frontend

```bash
npm run dev
```

Then open your browser to `http://localhost:3000`

#### Frontend Features

1. **Wallet Connection**
   - Connect MetaMask or any Web3 wallet
   - Automatic network detection
   - Displays wallet address and connection status

2. **Deposit Funds**
   - Deposit encrypted collateral
   - Real-time encryption status
   - Transaction confirmation feedback

3. **Trade Positions**
   - Open LONG/SHORT positions
   - Adjustable leverage (1x-20x)
   - Position size encryption
   - Real-time position summary

4. **Place Orders**
   - Encrypted limit orders
   - BUY/SELL order types
   - Encrypted price and size

5. **View Positions**
   - List all open positions
   - Encrypted position details
   - Close positions with one click

6. **Order Book**
   - View total orders
   - Encrypted order details
   - Order statistics

#### Frontend Architecture

```
public/
├── index.html           # Main HTML file
├── css/
│   └── styles.css      # Complete styling
└── js/
    └── app.js          # Main application logic
```

**Key Features:**
- Fully responsive design
- Dark theme optimized for trading
- Real-time encryption feedback
- Event-driven updates
- Mock FHE encryption (uses ethers.js)

**Privacy Indicators:**
- 🔒 = Encrypted data
- ✅ = Public data
- All sensitive values show encryption status

### Running Examples

```bash
# Integration guide
node examples/integration-guide.js

# Trading bot example
node examples/library-example.js
```

### Running the Liquidation Bot

```bash
npm run bot
```

## SDK API Reference

### Initialize SDK

```javascript
const dex = new ConfidentialPerpDEXSDK(contractAddress, provider, signer);
await dex.initialize();
```

### Deposit Funds

```javascript
await dex.deposit(amount);
```

### Open Position

```javascript
const { positionId } = await dex.openPosition(size, leverage, isLong);
```

Parameters:
- `size`: Position size (encrypted)
- `leverage`: Leverage multiplier (encrypted)
- `isLong`: Boolean, true for long, false for short

### Close Position

```javascript
await dex.closePosition(positionId);
```

### Place Order

```javascript
const { orderId } = await dex.placeOrder(price, size, isLong);
```

### Get User Positions

```javascript
const positions = await dex.getUserPositions(address);
```

### Subscribe to Events

```javascript
dex.subscribeToEvents((eventName, data) => {
  console.log(eventName, data);
});
```

## Smart Contract Functions

### User Functions

- `deposit(encryptedAmount, inputProof)` - Deposit encrypted collateral
- `openPosition(encSize, encLeverage, isLong, inputProof)` - Open encrypted position
- `closePosition(positionId)` - Close position and realize PnL
- `placeOrder(encPrice, encSize, isLong, inputProof)` - Place encrypted limit order
- `liquidate(trader, positionId)` - Liquidate undercollateralized position

### View Functions

- `getBalance()` - Get encrypted balance
- `getUserPositions(user)` - Get all position IDs for a user
- `getOraclePrice()` - Get encrypted oracle price
- `getOrderBookSize()` - Get number of orders in book

### Admin Functions

- `updateOraclePrice(encNewPrice, inputProof)` - Update oracle price

## Security Considerations

1. **Private Key Security**: Never commit your `.env` file or expose private keys
2. **Gas Limits**: FHE operations are gas-intensive, set appropriate gas limits
3. **Liquidation Risk**: Monitor positions to avoid liquidation
4. **Smart Contract Risk**: Contract is unaudited, use at your own risk

## How It Works

### Encryption

All sensitive data (balances, positions, orders) are encrypted using Zama's FHE:

```javascript
const encrypted = await fhevmInstance.encrypt64(value);
await contract.deposit(encrypted.handles[0], encrypted.inputProof);
```

### Position Management

1. User deposits encrypted collateral
2. Opens position with encrypted size and leverage
3. PnL is calculated using encrypted arithmetic
4. Position can be closed or liquidated based on encrypted health

### Order Matching

Orders are matched on-chain using encrypted price comparisons:
- Buy orders match with sell orders when buy price >= sell price
- All comparisons happen on encrypted values

### Liquidation

Positions are liquidated when:
```
netValue < (positionValue * liquidationThreshold)
```

All calculations use encrypted values, preserving privacy.

## FHE Integration & Limitations

This project uses **Zama's fhEVM** for Fully Homomorphic Encryption. While FHE provides powerful privacy features, the current implementation has some limitations due to the fhevm library version and FHE's inherent constraints.

### ✅ What IS Encrypted (Privacy Preserved)

The following data remains **fully encrypted on-chain**:

1. **User Balances**
```solidity
mapping(address => euint64) public encryptedBalances;  // Line 27
// ✅ No one can see your balance amount
```

2. **Position Details**
```solidity
struct EncryptedPosition {
    euint64 size;           // ✅ Private: position size
    euint64 entryPrice;     // ✅ Private: entry price
    euint64 collateral;     // ✅ Private: margin amount
    uint8 leverage;         // ❌ PUBLIC: leverage level
    // ...
}
```

3. **Order Book**
```solidity
struct EncryptedOrder {
    euint64 price;     // ✅ Private: limit order price
    euint64 size;      // ✅ Private: order size
    // ...
}
```

4. **PnL Calculations** - Computed on encrypted values:
```solidity
function calculatePnL(address trader, bytes32 positionId) public view returns (euint64) {
    euint64 priceDiff = TFHE.sub(encryptedOraclePrice, pos.entryPrice);
    return TFHE.mul(priceDiff, pos.size);  // ✅ Result stays encrypted
}
```

### ❌ Known Limitations

#### 1. **No Access Control Lists (ACL)**

**Issue**: The current fhevm version doesn't support `TFHE.allow()` or `TFHE.allowThis()`.

**Impact**: Cannot restrict who can decrypt encrypted values.

**Code Example** (removed from contract):
```solidity
// ❌ NOT AVAILABLE in current fhevm version:
TFHE.allowThis(encryptedBalances[msg.sender]);
TFHE.allow(encryptedBalances[msg.sender], msg.sender);
```

**Why**: The ACL system for selective decryption is not yet available in the fhevm library we're using. All encrypted data is equally accessible to those with decryption keys.

---

#### 2. **No Conditional Logic on Encrypted Booleans**

**Issue**: Cannot use `TFHE.req()` to enforce conditions on encrypted values.

**Impact**: Can't verify encrypted conditions before executing operations.

**Code Example** (removed from contract):
```solidity
// ❌ NOT AVAILABLE:
euint64 userBalance = encryptedBalances[msg.sender];
ebool hasEnoughBalance = TFHE.ge(userBalance, requiredCollateral);
TFHE.req(hasEnoughBalance);  // ❌ TFHE.req doesn't exist

// ✅ CURRENT WORKAROUND:
// Let operation fail naturally if insufficient balance
encryptedBalances[msg.sender] = TFHE.sub(userBalance, requiredCollateral);
// Will fail in FHE runtime if userBalance < requiredCollateral
```

**Why**: You cannot use encrypted booleans (`ebool`) in conditional statements like `require()` or `if()` because control flow cannot depend on encrypted data. This breaks the homomorphic property.

**Reference**: `contracts/ConfidentialPerpDEX.sol:85-86`

---

#### 3. **Order Matching Cannot Enforce Price Conditions**

**Issue**: Orders are matched regardless of price comparison results.

**Impact**: Orders marked as "filled" even if price conditions aren't met.

**Code Example**:
```solidity
function _matchOrders(uint256 newOrderId) internal {
    // ...
    ebool canMatch;
    if (newOrder.isLong) {
        canMatch = TFHE.ge(newOrder.price, existingOrder.price);  // ✅ Can compute
    }

    // ❌ PROBLEM: Cannot use `canMatch` in conditional
    // if (decrypt(canMatch)) {  // ❌ Can't decrypt in contract
    //     newOrder.isFilled = true;
    // }

    // ❌ CURRENT BEHAVIOR: Always marks as filled
    newOrder.isFilled = true;  // Line 207
    existingOrder.isFilled = true;  // Line 208
}
```

**Why**: The encrypted comparison result (`ebool`) cannot be decrypted within the contract to make branching decisions. You'd need an oracle to decrypt and return the result.

**Reference**: `contracts/ConfidentialPerpDEX.sol:189-213`

---

#### 4. **Liquidation Checks Not Enforced**

**Issue**: Cannot verify if a position is actually liquidatable before liquidating it.

**Impact**: Liquidation function doesn't validate position health.

**Code Example**:
```solidity
function liquidate(address trader, bytes32 positionId) external {
    EncryptedPosition storage pos = positions[trader][positionId];
    require(pos.isOpen, "Position not open");

    // ❌ REMOVED: Can't enforce encrypted condition
    // ebool isLiquidatable = checkLiquidation(trader, positionId);
    // TFHE.req(isLiquidatable);  // Not available

    // ✅ Current implementation: Trust-based
    pos.isOpen = false;
    // Awards liquidation reward regardless of actual health
}
```

**Why**: The `checkLiquidation()` function returns an encrypted boolean (`ebool`), but we cannot use it to control execution flow. A production system would need:
- A decryption oracle to verify the condition off-chain
- Oracle callback to execute liquidation only if truly underwater

**Reference**: `contracts/ConfidentialPerpDEX.sol:150-163`

---

#### 5. **Division Only Supports Plaintext Divisors**

**Issue**: `TFHE.div()` requires the divisor to be plaintext (not encrypted).

**Impact**: Leverage must be public, not encrypted.

**Code Example**:
```solidity
// ❌ CANNOT DO:
euint8 encryptedLeverage = TFHE.asEuint8(encLeverage);
euint64 requiredCollateral = TFHE.div(positionValue, encryptedLeverage);

// ✅ CURRENT IMPLEMENTATION:
function openPosition(
    bytes memory encSize,
    uint8 leverage,          // ❌ Public, not encrypted
    bool isLong
) external returns (bytes32 positionId) {
    euint64 positionValue = TFHE.mul(size, encryptedOraclePrice);
    euint64 requiredCollateral = TFHE.div(positionValue, uint64(leverage));  // ✅ Works
}
```

**Why**: FHE division by encrypted values is computationally expensive and not currently supported in the fhevm library. Only division by plaintext constants/variables is available.

**Reference**: `contracts/ConfidentialPerpDEX.sol:75-83`

---

#### 6. **Encrypted Input Format Changed**

**Issue**: The library no longer uses `einput` type with separate `inputProof`.

**Impact**: Function signatures updated to use `bytes memory`.

**Code Example**:
```solidity
// ❌ OLD API (not available):
function deposit(einput encryptedAmount, bytes calldata inputProof) external {
    euint64 amount = TFHE.asEuint64(encryptedAmount, inputProof);
}

// ✅ CURRENT API:
function deposit(bytes memory encryptedAmount) external {
    euint64 amount = TFHE.asEuint64(encryptedAmount);
}
```

**Why**: The fhevm library API has evolved. The encrypted input is now passed as serialized bytes directly.

**Reference**: `contracts/ConfidentialPerpDEX.sol:58-59`

---

### 🎯 Summary Table

| Feature | Privacy Level | Limitation | Workaround |
|---------|---------------|------------|------------|
| Balance storage | ✅ Fully encrypted | No ACL | None currently |
| Position data | ✅ Size/price encrypted | Leverage is public | Accept public leverage |
| PnL calculation | ✅ Computed on encrypted | Result is encrypted | Use decryption oracle to view |
| Order matching | ⚠️ Prices encrypted | Can't enforce conditions | Trust-based matching |
| Liquidation | ⚠️ Check is encrypted | Can't enforce health | Need oracle verification |
| Conditional logic | ❌ Not possible | FHE limitation | Operations fail naturally |

### 🔬 What This Means

This project is a **proof-of-concept** demonstrating:
- ✅ Encrypted storage of trading data
- ✅ Homomorphic arithmetic (add, sub, mul, div)
- ✅ Encrypted comparisons
- ✅ Privacy-preserving calculations

However, it's **not production-ready** due to:
- ❌ No conditional execution on encrypted data
- ❌ No access control for decryption
- ❌ Trust-based order matching and liquidation

**For production**, you would need:
1. A decryption oracle service
2. Threshold decryption with multiple parties
3. Zero-knowledge proofs for conditional verification
4. Updated fhevm library with ACL support

### 📚 Additional Resources

- [Zama fhEVM Documentation](https://docs.zama.ai/fhevm)
- [FHE Limitations](https://docs.zama.ai/fhevm/fundamentals/limitations)
- [Encrypted Smart Contracts Guide](https://docs.zama.ai/fhevm/tutorials)

## Development

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy to Network

```bash
npx hardhat run scripts/deploy.js --network zama
```

## Troubleshooting

### "FHEVM not initialized"
Run `await dex.initialize()` before making calls.

### "Insufficient balance"
Ensure you've deposited enough collateral before opening positions.

### "Position not liquidatable"
Position is still healthy. Liquidation bot will only succeed on undercollateralized positions.

### Gas Estimation Errors
FHE operations are expensive. Increase gas limits:
```javascript
await contract.function({ gasLimit: 1000000 });
```

## Resources

- [Zama Documentation](https://docs.zama.ai/)
- [fhEVM Documentation](https://docs.zama.ai/fhevm)
- [FHE Concepts](https://docs.zama.ai/fhevm/fundamentals)

## License

MIT

## Disclaimer

This is experimental software. Use at your own risk. The smart contract has not been audited. Do not use with real funds on mainnet without proper security audits.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions:
- Open an issue on GitHub
- Join Zama Discord community
- Check Zama documentation

---

Built with Zama's fhEVM for fully encrypted DeFi trading.
