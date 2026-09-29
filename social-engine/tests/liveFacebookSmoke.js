/**
 * Live Facebook Controlled Smoke Test
 * Phase 4: Tests Facebook live state safely without circumvention or evasion.
 * Verifies authentication state, challenge detection, and clean resource release.
 */

require('dotenv').config();
const SessionManager = require('../browser/sessionManager');
const FacebookAdapter = require('../platforms/facebook/facebookAdapter');
const HealthMonitor = require('../core/healthMonitor');
const { WorkerStateMachine, WORKER_STATES } = require('../core/stateMachine');

async function testLiveFacebook() {
  console.log('====================================================');
  console.log('🦅 GARUDA SOCIAL ENGINE: LIVE FACEBOOK SMOKE TEST');
  console.log('====================================================\n');

  const cookies = [];
  if (process.env.FB_C_USER) {
    cookies.push({ name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/' });
  }
  if (process.env.FB_XS) {
    cookies.push({ name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/' });
  }

  const sm = new WorkerStateMachine('facebook', (t) => {
    console.log(`▶ [Transition] ${t.from} -> ${t.to} (${t.reason})`);
  });

  const healthMonitor = new HealthMonitor('facebook');
  const sessionManager = new SessionManager('facebook', {
    useCdp: false,
    headless: 'new'
  });

  try {
    sm.transition(WORKER_STATES.ACQUIRING_LOCK, 'Acquiring profile lock');
    sm.transition(WORKER_STATES.STARTING_BROWSER, 'Launching isolated browser');

    const session = await sessionManager.initializeSession(cookies);
    if (!session.success) {
      sm.transition(WORKER_STATES.FAILED, session.error || session.reason);
      return { status: 'FAILED', reason: session.error };
    }

    const adapter = new FacebookAdapter(sessionManager, healthMonitor);
    sm.transition(WORKER_STATES.AUTH_CHECK, 'Evaluating live Facebook session & checkpoint status');

    const authRes = await adapter.verifyAuthentication(session.page);
    console.log('Facebook Auth Check Result:', authRes);

    if (authRes.challenge && authRes.challenge.detected) {
      sm.transition(WORKER_STATES.SECURITY_BLOCKED, `Challenge detected: ${authRes.challenge.type}`);
      console.log(`🔒 Facebook Status: SECURITY_BLOCKED (${authRes.challenge.type})`);
      return { status: 'SECURITY_BLOCKED', challenge: authRes.challenge.type };
    }

    if (authRes.authenticated) {
      sm.transition(WORKER_STATES.READY, 'Facebook authenticated successfully');
      console.log('✔ Facebook Status: READY (Authenticated)');
      return { status: 'VERIFIED', authenticated: true };
    } else {
      sm.transition(WORKER_STATES.AUTH_EXPIRED, authRes.reason || 'Login required');
      console.log('🟡 Facebook Status: AUTH_EXPIRED / CHECKPOINT');
      return { status: 'AUTH_EXPIRED', reason: authRes.reason };
    }
  } catch (err) {
    console.error('Facebook Smoke Error:', err.message);
    sm.transition(WORKER_STATES.FAILED, err.message);
    return { status: 'FAILED', error: err.message };
  } finally {
    sm.transition(WORKER_STATES.STOPPING, 'Releasing browser and lock');
    await sessionManager.closeSession();
    sm.transition(WORKER_STATES.STOPPED, 'Session closed cleanly');
  }
}

if (require.main === module) {
  testLiveFacebook().then(res => {
    console.log('\nFinal Live Facebook Result:', res);
  }).catch(console.error);
}

module.exports = testLiveFacebook;
