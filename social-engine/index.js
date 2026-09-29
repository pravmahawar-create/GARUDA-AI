/**
 * GARUDA Social Lead Engine - Production Entry Point
 */

require('dotenv').config();
const GarudaSocialOrchestrator = require('./core/orchestrator');
const LinkedInAdapter = require('./platforms/linkedin/linkedinAdapter');
const FacebookAdapter = require('./platforms/facebook/facebookAdapter');
const InstagramAdapter = require('./platforms/instagram/instagramAdapter');

async function bootstrap() {
  const orchestrator = new GarudaSocialOrchestrator();

  // 1. LinkedIn Adapter Setup
  const linkedinCookies = [];
  if (process.env.LINKEDIN_LI_AT) {
    linkedinCookies.push({ name: 'li_at', value: process.env.LINKEDIN_LI_AT.trim(), domain: '.linkedin.com', path: '/' });
  }
  if (process.env.LINKEDIN_JSESSIONID) {
    linkedinCookies.push({ name: 'JSESSIONID', value: process.env.LINKEDIN_JSESSIONID.trim(), domain: '.linkedin.com', path: '/' });
  }

  orchestrator.registerPlatform('linkedin', LinkedInAdapter, {
    useCdp: Boolean(process.env.USE_CDP_MODE === 'true'),
    cdpUrl: process.env.CDP_URL || 'http://127.0.0.1:9222',
    cookies: linkedinCookies
  });

  // 2. Facebook Adapter Setup
  const fbCookies = [];
  if (process.env.FB_C_USER && process.env.FB_XS) {
    fbCookies.push(
      { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/' },
      { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/' }
    );
  }

  orchestrator.registerPlatform('facebook', FacebookAdapter, {
    useCdp: Boolean(process.env.USE_CDP_MODE === 'true'),
    cdpUrl: process.env.CDP_URL || 'http://127.0.0.1:9222',
    cookies: fbCookies
  });

  // 3. Instagram Adapter Setup
  const igCookies = [];
  if (process.env.INSTAGRAM_SESSION_ID) {
    igCookies.push({ name: 'sessionid', value: process.env.INSTAGRAM_SESSION_ID.trim(), domain: '.instagram.com', path: '/' });
  }
  if (process.env.INSTAGRAM_USER_ID) {
    igCookies.push({ name: 'ds_user_id', value: process.env.INSTAGRAM_USER_ID.trim(), domain: '.instagram.com', path: '/' });
  }

  orchestrator.registerPlatform('instagram', InstagramAdapter, {
    useCdp: Boolean(process.env.USE_CDP_MODE === 'true'),
    cdpUrl: process.env.CDP_URL || 'http://127.0.0.1:9222',
    cookies: igCookies
  });

  // Start engine
  await orchestrator.startAll();
}

if (require.main === module) {
  bootstrap().catch(err => {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  });
}

module.exports = bootstrap;
