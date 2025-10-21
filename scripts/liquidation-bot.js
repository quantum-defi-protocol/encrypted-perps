import { ethers } from "ethers";
import { ConfidentialPerpDEXSDK } from "../src/perp-dex-sdk.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Liquidation Bot
 *
 * Monitors positions and automatically liquidates undercollateralized positions
 * to earn liquidation rewards while maintaining protocol health.
 */

class LiquidationBot {
  constructor(contractAddress, rpcUrl, privateKey) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.dex = new ConfidentialPerpDEXSDK(contractAddress, this.provider, this.signer);
    this.contract = this.dex.contract;

    this.monitoredPositions = new Set();
    this.checkInterval = 30000; // Check every 30 seconds
    this.isRunning = false;
    this.stats = {
      positionsChecked: 0,
      liquidationsExecuted: 0,
      totalRewards: 0n,
      errors: 0
    };
  }

  async initialize() {
    try {
      await this.dex.initialize();
      console.log("✅ Liquidation bot initialized");
      console.log("📍 Contract:", this.dex.contractAddress);
      console.log("👤 Bot address:", await this.signer.getAddress());

      // Subscribe to position events
      this.dex.subscribeToEvents((eventName, data) => {
        this.handleEvent(eventName, data);
      });

      console.log("👂 Listening for position events...\n");
    } catch (error) {
      console.error("❌ Initialization failed:", error.message);
      throw error;
    }
  }

  handleEvent(eventName, data) {
    switch (eventName) {
      case "PositionOpened":
        console.log(`📈 New position detected: ${data.positionId}`);
        this.monitoredPositions.add({
          trader: data.trader,
          positionId: data.positionId,
          isLong: data.isLong,
          timestamp: Date.now()
        });
        break;

      case "PositionClosed":
        console.log(`📉 Position closed: ${data.positionId}`);
        this.removePosition(data.positionId);
        break;

      case "LiquidationTriggered":
        if (data.trader !== this.signer.address) {
          console.log(`⚠️ Position liquidated by another bot: ${data.positionId}`);
        }
        this.removePosition(data.positionId);
        break;
    }
  }

  removePosition(positionId) {
    for (const pos of this.monitoredPositions) {
      if (pos.positionId === positionId) {
        this.monitoredPositions.delete(pos);
        break;
      }
    }
  }

  async checkPositionHealth(trader, positionId) {
    try {
      // Note: In production, you would need to decrypt and check the actual values
      // This is a simplified version that attempts liquidation
      const position = await this.contract.positions(trader, positionId);

      if (!position.isOpen) {
        return { liquidatable: false, reason: "Position closed" };
      }

      // Attempt to check liquidation status
      // In FHE, we can't directly read encrypted values, so we try to liquidate
      // and let the contract reject if it's not liquidatable
      return { liquidatable: true, reason: "Needs verification" };

    } catch (error) {
      return { liquidatable: false, reason: error.message };
    }
  }

  async attemptLiquidation(trader, positionId) {
    try {
      console.log(`🔍 Attempting liquidation: ${trader} - ${positionId}`);

      const tx = await this.contract.liquidate(trader, positionId, {
        gasLimit: 500000
      });

      console.log(`⏳ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        this.stats.liquidationsExecuted++;
        console.log(`✅ Liquidation successful! Gas used: ${receipt.gasUsed.toString()}`);
        return { success: true, receipt };
      } else {
        console.log(`❌ Liquidation failed (reverted)`);
        return { success: false, error: "Transaction reverted" };
      }
    } catch (error) {
      // Expected behavior for non-liquidatable positions
      if (error.message.includes("revert") || error.message.includes("TFHE.req")) {
        console.log(`⏭️ Position not liquidatable yet`);
      } else {
        console.error(`❌ Liquidation error: ${error.message}`);
        this.stats.errors++;
      }
      return { success: false, error: error.message };
    }
  }

  async scanPositions() {
    console.log(`\n🔍 Scanning ${this.monitoredPositions.size} positions...`);
    const startTime = Date.now();

    for (const position of this.monitoredPositions) {
      this.stats.positionsChecked++;

      const health = await this.checkPositionHealth(
        position.trader,
        position.positionId
      );

      if (health.liquidatable) {
        console.log(`⚠️ Found potentially liquidatable position:`);
        console.log(`   Trader: ${position.trader}`);
        console.log(`   Position: ${position.positionId}`);

        const result = await this.attemptLiquidation(
          position.trader,
          position.positionId
        );

        if (result.success) {
          // Wait a bit after successful liquidation
          await new Promise(r => setTimeout(r, 5000));
        }
      }

      // Small delay between checks
      await new Promise(r => setTimeout(r, 1000));
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Scan completed in ${elapsed}s`);
    this.printStats();
  }

  printStats() {
    console.log("\n📊 Bot Statistics:");
    console.log("─".repeat(50));
    console.log(`  Monitored Positions: ${this.monitoredPositions.size}`);
    console.log(`  Positions Checked:   ${this.stats.positionsChecked}`);
    console.log(`  Liquidations:        ${this.stats.liquidationsExecuted}`);
    console.log(`  Errors:              ${this.stats.errors}`);
    console.log("─".repeat(50));
  }

  async start() {
    if (this.isRunning) {
      console.log("⚠️ Bot is already running");
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Liquidation bot started`);
    console.log(`⏰ Check interval: ${this.checkInterval / 1000}s\n`);

    while (this.isRunning) {
      try {
        await this.scanPositions();
      } catch (error) {
        console.error("❌ Scan error:", error.message);
        this.stats.errors++;
      }

      if (this.isRunning) {
        console.log(`\n⏳ Next scan in ${this.checkInterval / 1000}s...\n`);
        await new Promise(r => setTimeout(r, this.checkInterval));
      }
    }
  }

  stop() {
    console.log("\n🛑 Stopping liquidation bot...");
    this.isRunning = false;
    this.dex.unsubscribeFromEvents();
    this.printStats();
    console.log("✅ Bot stopped");
  }
}

// Main execution
async function main() {
  console.log("🤖 Confidential PerpDEX Liquidation Bot");
  console.log("=".repeat(60));
  console.log("");

  if (!process.env.CONTRACT_ADDRESS || !process.env.PRIVATE_KEY) {
    console.error("❌ Missing environment variables!");
    console.error("   Please set CONTRACT_ADDRESS and PRIVATE_KEY in .env");
    process.exit(1);
  }

  const bot = new LiquidationBot(
    process.env.CONTRACT_ADDRESS,
    process.env.RPC_URL || "https://devnet.zama.ai",
    process.env.PRIVATE_KEY
  );

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n⚠️ Received SIGINT signal");
    bot.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n\n⚠️ Received SIGTERM signal");
    bot.stop();
    process.exit(0);
  });

  try {
    await bot.initialize();
    await bot.start();
  } catch (error) {
    console.error("❌ Fatal error:", error);
    bot.stop();
    process.exit(1);
  }
}

main().catch(console.error);
