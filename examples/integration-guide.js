import { ethers } from "ethers";
import { ConfidentialPerpDEXSDK } from "../src/perp-dex-sdk.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Integration Guide: How to use Confidential Perpetual DEX
 *
 * This example demonstrates the complete workflow for trading
 * on the confidential perpetual DEX with encrypted positions.
 */

async function main() {
  console.log("🚀 Confidential PerpDEX Integration Guide\n");

  // Step 1: Setup provider and signer
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("📍 Connected to:", await provider.getNetwork().then(n => n.name));
  console.log("👤 Address:", await signer.getAddress());
  console.log("💰 Balance:", ethers.formatEther(await provider.getBalance(signer.address)), "ETH\n");

  // Step 2: Initialize SDK
  const dex = new ConfidentialPerpDEXSDK(
    process.env.CONTRACT_ADDRESS,
    provider,
    signer
  );

  await dex.initialize();
  console.log("");

  // Step 3: Deposit collateral (encrypted)
  console.log("📌 STEP 1: Deposit Collateral");
  console.log("─".repeat(50));
  await dex.deposit(1000000); // Deposit 10,000.00 (assuming 2 decimals)
  console.log("");

  // Step 4: Open a long position
  console.log("📌 STEP 2: Open Long Position");
  console.log("─".repeat(50));
  const { positionId } = await dex.openPosition(
    100,    // size: 1.00 BTC
    5,      // leverage: 5x
    true    // isLong: true
  );
  console.log("");

  // Step 5: Place a limit order
  console.log("📌 STEP 3: Place Limit Order");
  console.log("─".repeat(50));
  await dex.placeOrder(
    5100000, // price: 51,000.00
    50,      // size: 0.50 BTC
    false    // isLong: false (sell order)
  );
  console.log("");

  // Step 6: View user positions
  console.log("📌 STEP 4: View Positions");
  console.log("─".repeat(50));
  const positions = await dex.getUserPositions();
  positions.forEach((pos, i) => {
    console.log(`  Position ${i + 1}: ${pos}`);
  });
  console.log("");

  // Step 7: Subscribe to events
  console.log("📌 STEP 5: Event Monitoring");
  console.log("─".repeat(50));
  dex.subscribeToEvents((eventName, data) => {
    console.log(`🔔 Event: ${eventName}`, data);
  });

  console.log("Listening for events for 30 seconds...");
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Step 8: Close position
  console.log("\n📌 STEP 6: Close Position");
  console.log("─".repeat(50));
  await dex.closePosition(positionId);
  console.log("");

  // Cleanup
  dex.unsubscribeFromEvents();
  console.log("✅ Integration guide completed!");
}

main().catch(console.error);
