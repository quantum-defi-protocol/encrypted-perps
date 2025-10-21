import { ethers } from "ethers";
import { ConfidentialPerpDEXSDK } from "../src/perp-dex-sdk.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Library Usage Example
 *
 * Demonstrates how to integrate the SDK into your application
 * with error handling and best practices.
 */

class TradingBot {
  constructor(contractAddress, rpcUrl, privateKey) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.dex = new ConfidentialPerpDEXSDK(contractAddress, this.provider, this.signer);
    this.positions = new Map();
  }

  async initialize() {
    try {
      await this.dex.initialize();
      console.log("✅ Trading bot initialized");

      // Setup event listeners
      this.dex.subscribeToEvents((eventName, data) => {
        this.handleEvent(eventName, data);
      });
    } catch (error) {
      console.error("❌ Initialization failed:", error.message);
      throw error;
    }
  }

  handleEvent(eventName, data) {
    switch (eventName) {
      case "PositionOpened":
        console.log(`📈 New position opened by ${data.trader}`);
        this.positions.set(data.positionId, {
          trader: data.trader,
          isLong: data.isLong,
          timestamp: Date.now()
        });
        break;

      case "PositionClosed":
        console.log(`📉 Position closed: ${data.positionId}`);
        this.positions.delete(data.positionId);
        break;

      case "LiquidationTriggered":
        console.log(`⚠️ Liquidation: ${data.trader} - ${data.positionId}`);
        this.positions.delete(data.positionId);
        break;

      case "OrderPlaced":
        console.log(`📝 Order placed: ${data.orderId} by ${data.trader}`);
        break;

      default:
        console.log(`🔔 Unknown event: ${eventName}`);
    }
  }

  async openLongPosition(size, leverage) {
    try {
      console.log(`\n🎯 Opening LONG position: ${size} @ ${leverage}x leverage`);
      const result = await this.dex.openPosition(size, leverage, true);
      console.log(`✅ Position ID: ${result.positionId}`);
      return result.positionId;
    } catch (error) {
      console.error("❌ Failed to open position:", error.message);
      throw error;
    }
  }

  async openShortPosition(size, leverage) {
    try {
      console.log(`\n🎯 Opening SHORT position: ${size} @ ${leverage}x leverage`);
      const result = await this.dex.openPosition(size, leverage, false);
      console.log(`✅ Position ID: ${result.positionId}`);
      return result.positionId;
    } catch (error) {
      console.error("❌ Failed to open position:", error.message);
      throw error;
    }
  }

  async closePositionById(positionId) {
    try {
      console.log(`\n🔒 Closing position: ${positionId}`);
      await this.dex.closePosition(positionId);
      console.log("✅ Position closed successfully");
    } catch (error) {
      console.error("❌ Failed to close position:", error.message);
      throw error;
    }
  }

  async depositFunds(amount) {
    try {
      console.log(`\n💰 Depositing ${amount}...`);
      await this.dex.deposit(amount);
      console.log("✅ Deposit successful");
    } catch (error) {
      console.error("❌ Deposit failed:", error.message);
      throw error;
    }
  }

  async getMyPositions() {
    try {
      const address = await this.signer.getAddress();
      const positions = await this.dex.getUserPositions(address);
      console.log(`\n📊 Active positions: ${positions.length}`);
      return positions;
    } catch (error) {
      console.error("❌ Failed to fetch positions:", error.message);
      throw error;
    }
  }

  async placeLimitOrder(price, size, isBuy) {
    try {
      console.log(`\n📝 Placing ${isBuy ? 'BUY' : 'SELL'} limit order`);
      const result = await this.dex.placeOrder(price, size, isBuy);
      console.log(`✅ Order ID: ${result.orderId}`);
      return result.orderId;
    } catch (error) {
      console.error("❌ Failed to place order:", error.message);
      throw error;
    }
  }

  shutdown() {
    this.dex.unsubscribeFromEvents();
    console.log("\n👋 Trading bot shutdown");
  }
}

// Example usage
async function runExample() {
  console.log("🤖 Trading Bot Example\n");
  console.log("=".repeat(60));

  const bot = new TradingBot(
    process.env.CONTRACT_ADDRESS,
    process.env.RPC_URL,
    process.env.PRIVATE_KEY
  );

  try {
    // Initialize
    await bot.initialize();

    // Deposit collateral
    await bot.depositFunds(5000000); // 50,000.00

    // Open positions
    const longPositionId = await bot.openLongPosition(100, 10); // 1.00 BTC @ 10x
    await new Promise(r => setTimeout(r, 2000));

    const shortPositionId = await bot.openShortPosition(50, 5); // 0.50 BTC @ 5x
    await new Promise(r => setTimeout(r, 2000));

    // Place limit orders
    await bot.placeLimitOrder(5200000, 25, true);  // Buy order
    await bot.placeLimitOrder(4800000, 25, false); // Sell order
    await new Promise(r => setTimeout(r, 2000));

    // View positions
    await bot.getMyPositions();

    // Wait for events
    console.log("\n⏳ Monitoring for 20 seconds...");
    await new Promise(r => setTimeout(r, 20000));

    // Close positions
    await bot.closePositionById(longPositionId);
    await new Promise(r => setTimeout(r, 2000));

    await bot.closePositionById(shortPositionId);

    console.log("\n✅ Example completed successfully!");
  } catch (error) {
    console.error("\n❌ Example failed:", error);
  } finally {
    bot.shutdown();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample().catch(console.error);
}

export { TradingBot };
