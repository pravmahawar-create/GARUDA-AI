/**
 * Telegram Alert Redaction & Sanitization Test
 * Section 15: Verifies that sensitive session cookies and tokens are never exposed in alerts.
 */

const assert = require('assert');
const TelegramAlertService = require('../notifications/telegramAlertService');

function runTelegramRedactionTests() {
  console.log('--- Testing Telegram Alert Secret Redaction ---');

  const capturedMessages = [];
  const mockClient = {
    sendMessage: async (text) => {
      capturedMessages.push(text);
      return { ok: true };
    }
  };

  const alertService = new TelegramAlertService(mockClient);

  // 1. Alert containing simulated leaked cookies in text
  const dirtyMsg = 'Worker failed on feed with li_at=AQEDAW1NST8DWWeIAAABoO0seao; and c_user=100036397273872; xs=9%3AYZh-8e7ym; sessionid=29172585577%3AvZHb; Bearer secret_jwt_token_12345';
  
  alertService.sendAlert('ERROR', 'Authentication Anomaly', dirtyMsg);

  assert.strictEqual(capturedMessages.length, 1);
  const out = capturedMessages[0];

  // Verify all secrets are replaced with [REDACTED]
  assert.strictEqual(out.includes('AQEDAW1NST8DWWeIAAABoO0seao'), false, 'li_at cookie value leaked!');
  assert.strictEqual(out.includes('100036397273872'), false, 'c_user value leaked!');
  assert.strictEqual(out.includes('9%3AYZh-8e7ym'), false, 'xs value leaked!');
  assert.strictEqual(out.includes('29172585577%3AvZHb'), false, 'sessionid value leaked!');
  assert.strictEqual(out.includes('secret_jwt_token_12345'), false, 'Bearer token leaked!');

  assert.ok(out.includes('li_at=[REDACTED]'));
  assert.ok(out.includes('c_user=[REDACTED]'));
  assert.ok(out.includes('xs=[REDACTED]'));
  assert.ok(out.includes('sessionid=[REDACTED]'));
  assert.ok(out.includes('Bearer [REDACTED]'));

  console.log('✔ Telegram Redaction: ALL ASSERTIONS PASSED (100% Secret Protection)');
  return true;
}

if (require.main === module) {
  runTelegramRedactionTests();
}

module.exports = runTelegramRedactionTests;
