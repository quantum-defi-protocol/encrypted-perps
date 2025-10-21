import { ethers } from "ethers";
import { createInstance } from "fhevmjs";

const CONTRACT_ABI = [
  "function deposit(bytes32 encryptedAmount, bytes calldata inputProof) external",
  "function getBalance() external view returns (uint256)",
  "function openPosition(bytes32 encSize, bytes32 encLeverage, bool isLong, bytes calldata inputProof) external returns (bytes32)",
  "function closePosition(bytes32 positionId) external",
  "function placeOrder(bytes32 encPrice, bytes32 encSize, bool isLong, bytes calldata inputProof) external returns (uint256)",
  "function getUserPositions(address user) external view returns (bytes32[])",
  "function getOraclePrice() external view returns (uint256)",
  "function liquidate(address trader, bytes32 positionId) external",
  "event PositionOpened(address indexed trader, bytes32 indexed positionId, bool isLong)",
  "event PositionClosed(address indexed trader, bytes32 indexed positionId)",
  "event OrderPlaced(address indexed trader, uint256 indexed orderId, bool isLong)",
  "event LiquidationTriggered(address indexed trader, bytes32 indexed positionId)"
];

export class ConfidentialPerpDEXSDK {
  constructor(contractAddress, provider, signer) {
    this.contractAddress = contractAddress;
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
    this.fhevmInstance = null;
  }

  async initialize() {
    this.fhevmInstance = await createInstance({
      chainId: await this.provider.getNetwork().then(n => n.chainId),
      publicKey: await this.provider.call({ to: this.contractAddress, data: "0x..." })
    });
    console.log("✅ FHEVM instance initialized");
  }

  async encryptValue(value) {
    if (!this.fhevmInstance) {
      throw new Error("SDK not initialized. Call initialize() first.");
    }
    return this.fhevmInstance.encrypt64(value);
  }

  async deposit(amount) {
    console.log(`💰 Depositing ${amount}...`);
    const encrypted = await this.encryptValue(amount);
    const tx = await this.contract.deposit(encrypted.handles[0], encrypted.inputProof);
    const receipt = await tx.wait();
    console.log("✅ Deposit successful:", receipt.hash);
    return receipt;
  }

  async openPosition(size, leverage, isLong) {
    console.log(`📈 Opening ${isLong ? 'LONG' : 'SHORT'} position: size=${size}, leverage=${leverage}x`);

    const encryptedSize = await this.encryptValue(size);
    const encryptedLeverage = await this.encryptValue(leverage);

    const tx = await this.contract.openPosition(
      encryptedSize.handles[0],
      encryptedLeverage.handles[0],
      isLong,
      encryptedSize.inputProof
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        return this.contract.interface.parseLog(log).name === "PositionOpened";
      } catch {
        return false;
      }
    });

    const positionId = event ? this.contract.interface.parseLog(event).args.positionId : null;
    console.log("✅ Position opened:", positionId);
    return { receipt, positionId };
  }

  async closePosition(positionId) {
    console.log(`📉 Closing position: ${positionId}`);
    const tx = await this.contract.closePosition(positionId);
    const receipt = await tx.wait();
    console.log("✅ Position closed:", receipt.hash);
    return receipt;
  }

  async placeOrder(price, size, isLong) {
    console.log(`📝 Placing ${isLong ? 'BUY' : 'SELL'} order: price=${price}, size=${size}`);

    const encryptedPrice = await this.encryptValue(price);
    const encryptedSize = await this.encryptValue(size);

    const tx = await this.contract.placeOrder(
      encryptedPrice.handles[0],
      encryptedSize.handles[0],
      isLong,
      encryptedPrice.inputProof
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        return this.contract.interface.parseLog(log).name === "OrderPlaced";
      } catch {
        return false;
      }
    });

    const orderId = event ? this.contract.interface.parseLog(event).args.orderId : null;
    console.log("✅ Order placed:", orderId);
    return { receipt, orderId };
  }

  async getUserPositions(address) {
    const positions = await this.contract.getUserPositions(address || await this.signer.getAddress());
    console.log(`📊 User has ${positions.length} position(s)`);
    return positions;
  }

  async liquidate(trader, positionId) {
    console.log(`⚠️ Attempting liquidation: trader=${trader}, position=${positionId}`);
    const tx = await this.contract.liquidate(trader, positionId);
    const receipt = await tx.wait();
    console.log("✅ Liquidation executed:", receipt.hash);
    return receipt;
  }

  subscribeToEvents(callback) {
    this.contract.on("PositionOpened", (trader, positionId, isLong, event) => {
      callback("PositionOpened", { trader, positionId, isLong, event });
    });

    this.contract.on("PositionClosed", (trader, positionId, event) => {
      callback("PositionClosed", { trader, positionId, event });
    });

    this.contract.on("OrderPlaced", (trader, orderId, isLong, event) => {
      callback("OrderPlaced", { trader, orderId, isLong, event });
    });

    this.contract.on("LiquidationTriggered", (trader, positionId, event) => {
      callback("LiquidationTriggered", { trader, positionId, event });
    });

    console.log("👂 Subscribed to contract events");
  }

  unsubscribeFromEvents() {
    this.contract.removeAllListeners();
    console.log("🔇 Unsubscribed from all events");
  }
}

export default ConfidentialPerpDEXSDK;
