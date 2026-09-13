#!/usr/bin/env node
/**
 * 🦅 GARUDA: 24/7 Global Autonomous Quant Daemon Launcher
 * Usage:
 *   node scripts/launch-24x7-quant-daemon.js --once
 *   node scripts/launch-24x7-quant-daemon.js --daemon --interval 60
 */

const { Global24x7QuantDaemon } = require('../src/services/alphaQuant/global24x7QuantDaemon');

async function main() {
  const args = process.argv.slice(2);
  const isOnce = args.includes('--once');
  const enableAlerts = args.includes('--alerts');

  let interval = 60;
  const intIdx = args.indexOf('--interval');
  if (intIdx !== -1 && args[intIdx + 1]) {
    interval = parseInt(args[intIdx + 1], 10) || 60;
  }

  const daemon = new Global24x7QuantDaemon({
    pollIntervalSeconds: interval,
    minConfidenceThreshold: 82,
    maxDailyTrades: 5,
    dailyProfitTargetInr: 2500, // ₹2,500 target (+2.5% daily growth)
    dailyMaxLossInr: 1200,      // ₹1,200 loss limit (capital defense)
    initialCapital: 100000,
    sendTelegramAlerts: enableAlerts
  });

  if (isOnce) {
    console.log('🦅 Running single 24/7 Global Quant cycle across active markets...');
    const result = await daemon.runCycle();
    console.log('\n--- 24/7 Cycle Result ---');
    console.log('Active Session:', result.activeMarkets.currentSession);
    console.log('India Open:', result.activeMarkets.isIndiaOpen);
    console.log('Forex Open:', result.activeMarkets.isForexOpen);
    console.log('Crypto Open:', result.activeMarkets.isCryptoOpen);
    console.log('Wallet Balance: ₹' + result.walletBalance.toLocaleString('en-IN'));
    console.log('Findings Scanned:', result.findingsScanned);
    process.exit(0);
  } else {
    console.log(`🦅 Launching GARUDA 24/7 Global Quant Daemon (Polling every ${interval}s)...`);
    daemon.start();

    process.on('SIGINT', () => {
      console.log('\nStopping 24/7 daemon...');
      daemon.stop();
      process.exit(0);
    });
  }
}

main().catch(err => {
  console.error('Fatal Error running 24x7 daemon:', err);
  process.exit(1);
});
