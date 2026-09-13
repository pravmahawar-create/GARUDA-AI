/**
 * 🦅 GARUDA Alpha-Quant: Telegram Executive Notifier
 * Dispatches high-conviction Roman Hindi alerts directly to Founder Praveen.
 */

const https = require('https');

class TelegramQuantNotifier {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_FOUNDER_CHAT_ID;
  }

  async sendMessage(text) {
    if (!this.botToken || !this.chatId) {
      console.log('[TelegramQuantNotifier] Tokens not configured, simulated log:\n', text);
      return { success: false, reason: 'Tokens not set' };
    }

    return new Promise((resolve) => {
      const postData = JSON.stringify({
        chat_id: this.chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      const req = https.request({
        hostname: 'api.telegram.org',
        path: `/bot${this.botToken}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ success: parsed.ok, result: parsed });
          } catch (e) {
            resolve({ success: false, error: e.message });
          }
        });
      });

      req.on('error', (err) => {
        console.warn('[TelegramQuantNotifier] Error dispatching Telegram message:', err.message);
        resolve({ success: false, error: err.message });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Alert for a high-probability trade signal (Score >= 75%)
   */
  async notifySignalTriggered(signal, symbol, symbolName, quantity) {
    const icon = signal.direction === 'BULLISH' ? '🟢' : '🔴';
    const actionText = signal.action === 'BUY' ? 'VIRTUAL BUY (Kharid)' : 'VIRTUAL SELL (Bikri)';

    const msg = 
`🦅 *GARUDA Alpha-Quant: High-Conviction Signal*
${icon} *Action*: ${actionText} | ${symbolName} (\`${symbol}\`)

📊 *Probability Score*: *${signal.score}%* (Threshold: ≥75%)
💰 *Virtual Entry*: ₹${signal.price} (Qty: ${quantity} shares)
🛑 *Strict Stop-Loss*: ₹${signal.stopLoss} (Risk: ₹${signal.riskPerShare}/share)
🎯 *Target 1*: ₹${signal.target1} (Trailing SL Trigger)
🏁 *Target 2*: ₹${signal.target2} (Expected Gain: ₹${signal.rewardPerShare}/share)
⚖️ *Risk-to-Reward*: \`${signal.riskRewardRatio}\`

🧠 *Kyun Liya*:
• ${signal.factors[0] || 'Technical Confluence'}
• ${signal.factors[1] || 'Volume & Momentum Confirmation'}

🛡️ _Status: Virtual Paper-Trade Active. Real Capital 100% Protected._`;

    return this.sendMessage(msg);
  }

  /**
   * Alert for closed trade (Target or SL hit)
   */
  async notifyTradeClosed(closedTrade) {
    const isWin = closedTrade.isWin;
    const icon = isWin ? '🎯' : '🛑';
    const resultTitle = isWin ? 'PROFIT BOOKED' : 'STOP-LOSS TRIGGERED (Capital Protected)';

    const msg =
`🦅 *GARUDA Alpha-Quant: Trade Update*
${icon} *${resultTitle}* — ${closedTrade.symbolName}

📊 *Exit Reason*: \`${closedTrade.exitReason}\`
💵 *Entry Price*: ₹${closedTrade.entryPrice}
🏁 *Exit Price*: ₹${closedTrade.exitPrice}
📈 *Net P&L*: *${closedTrade.netPnl >= 0 ? '+' : ''}₹${closedTrade.netPnl}* (Qty: ${closedTrade.quantity})

💼 _Ledger Automatically Updated in GARUDA Sovereign Database._`;

    return this.sendMessage(msg);
  }

  /**
   * Daily Executive Closing Briefing (at 3:30 PM IST)
   */
  async notifyDailySummary(stats) {
    const msg =
`🦅 *GARUDA Alpha-Quant: Daily Paper Trading Dossier*

📅 *Session Status*: Market Closed
💼 *Current Virtual Wallet*: ₹${stats.currentWalletBalance.toLocaleString('en-IN')}
📊 *Total Trades*: ${stats.totalTrades} (Won: ${stats.winCount} | Lost: ${stats.lossCount})
🏆 *Win Rate*: *${stats.winRatePercent}%*
💰 *Total Realized P&L*: *${stats.netPnl >= 0 ? '+' : ''}₹${stats.netPnl.toLocaleString('en-IN')}*
📈 *ROI on Capital*: ${stats.roiPercent}%
⚡ *Profit Factor*: ${stats.profitFactor}

🛡️ *Zero Real Money Risked*. All trades validated against live NSE tick data.`;

    return this.sendMessage(msg);
  }
}

module.exports = {
  TelegramQuantNotifier
};
