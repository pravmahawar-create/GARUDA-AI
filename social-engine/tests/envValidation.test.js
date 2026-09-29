/**
 * Environment & Configuration Validation Suite
 * Section 16: Inspects presence/absence of required credentials without printing secret values.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function validateEnvironment() {
  console.log('--- Validating Social Engine Environment ---');

  const report = {
    browserConfig: {
      chromeExecutableExists: fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'),
      useCdpMode: process.env.USE_CDP_MODE === 'true',
      cdpUrlConfigured: Boolean(process.env.CDP_URL)
    },
    platformSessions: {
      linkedin: {
        hasLiAt: Boolean(process.env.LINKEDIN_LI_AT),
        hasJsessionId: Boolean(process.env.LINKEDIN_JSESSIONID),
        ready: Boolean(process.env.LINKEDIN_LI_AT && process.env.LINKEDIN_JSESSIONID)
      },
      facebook: {
        hasCUser: Boolean(process.env.FB_C_USER),
        hasXs: Boolean(process.env.FB_XS),
        ready: Boolean(process.env.FB_C_USER && process.env.FB_XS)
      },
      instagram: {
        hasSessionId: Boolean(process.env.INSTAGRAM_SESSION_ID),
        hasUserId: Boolean(process.env.INSTAGRAM_USER_ID),
        ready: Boolean(process.env.INSTAGRAM_SESSION_ID && process.env.INSTAGRAM_USER_ID)
      }
    },
    telegram: {
      hasBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      hasChatId: Boolean(process.env.TELEGRAM_FOUNDER_CHAT_ID || process.env.TELEGRAM_CHAT_ID),
      ready: Boolean(process.env.TELEGRAM_BOT_TOKEN && (process.env.TELEGRAM_FOUNDER_CHAT_ID || process.env.TELEGRAM_CHAT_ID))
    },
    stateStore: {
      dataDirExists: fs.existsSync(path.resolve(__dirname, '../../data/leads'))
    }
  };

  console.log('Browser Config:', report.browserConfig);
  console.log('LinkedIn Session Present:', report.platformSessions.linkedin.ready);
  console.log('Facebook Session Present:', report.platformSessions.facebook.ready);
  console.log('Instagram Session Present:', report.platformSessions.instagram.ready);
  console.log('Telegram Alerting Present:', report.telegram.ready);
  console.log('State Store Directory Present:', report.stateStore.dataDirExists);

  return report;
}

if (require.main === module) {
  validateEnvironment();
}

module.exports = validateEnvironment;
