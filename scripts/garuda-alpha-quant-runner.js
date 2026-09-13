#!/usr/bin/env node
/**
 * 🦅 GARUDA Alpha-Quant: Command Line Runner & Simulator
 * Run this to launch real-time scanning or 5-day historical simulation.
 * 
 * Usage:
 *   node scripts/garuda-alpha-quant-runner.js --simulate
 *   node scripts/garuda-alpha-quant-runner.js --live
 */

const { AlphaQuantDaemon } = require('../src/services/alphaQuant/alphaQuantDaemon');

async function main() {
  const args = process.argv.slice(2);
  const isLive = args.includes('--live');
  const enableAlerts = args.includes('--alerts');

  const daemon = new AlphaQuantDaemon({
    minConfidenceThreshold: 78,
    initialCapital: 100000,
    sendTelegramAlerts: enableAlerts
  });

  if (isLive) {
    console.log('🦅 Running GARUDA Alpha-Quant Live Market Scan...');
    const findings = await daemon.scanLiveMarket();
    console.log('\n--- Live Scan Results ---');
    findings.forEach(f => {
      const status = f.signal.isQualified ? '🟢 HIGH PROBABILITY (≥75%)' : '⚪ FILTERED (<75%)';
      console.log(`${f.name} (₹${f.price}): Score ${f.signal.score}% [${f.signal.direction}] -> ${status}`);
    });
  } else {
    console.log('🦅 Launching GARUDA Alpha-Quant 5-Day Historical Tick Simulation...');
    const result = await daemon.runHistoricalSimulation('5d');
    console.log('✅ Simulation Complete. Full ledger stored in data/garuda-alpha-quant-ledger.json');
  }
}

main().catch(err => {
  console.error('Fatal Error running Alpha-Quant:', err);
  process.exit(1);
});
