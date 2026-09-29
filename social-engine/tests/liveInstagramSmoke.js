/**
 * Live Instagram Controlled Smoke Test
 * Phase 5: Tests Instagram live state safely without circumvention or evasion.
 * Verifies authentication state, challenge detection, and clean resource release.
 */

require('dotenv').config();
const SessionManager = require('../browser/sessionManager');
const InstagramAdapter = require('../platforms/instagram/instagramAdapter');
const HealthMonitor = require('../core/healthMonitor');
const { WorkerStateMachine, WORKER_STATES } = require('../core/stateMachine');

async function testLiveInstagram() {
  console.log('====================================================');
  console.log('🦅 GARUDA SOCIAL ENGINE: LIVE INSTAGRAM SMOKE TEST');
  console.log('====================================================\n');

  const cookies = [];
  if (process.env.INSTAGRAM_SESSION_ID) {
    cookies.push({ name: 'sessionid', value: process.env.INSTAGRAM_SESSION_ID.trim(), domain: '.instagram.com', path: '/' });
  }
  if (process.env.INSTAGRAM_USER_ID) {
    cookies.push({ name: 'ds_user_id', value: process.env.INSTAGRAM_USER_ID.trim(), domain: '.instagram.com', path: '/' });
  }

  const sm = new WorkerStateMachine('instagram', (t) => {
    console.log(`▶ [Transition] ${t.from} -> ${t.to} (${t.reason})`);
  });

  const healthMonitor = new HealthMonitor('instagram');
  const sessionManager = new SessionManager('instagram', {
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

    const adapter = new InstagramAdapter(sessionManager, healthMonitor);
    sm.transition(WORKER_STATES.AUTH_CHECK, 'Evaluating live Instagram session & challenge status');

    const authRes = await adapter.verifyAuthentication(session.page);
    console.log('Instagram Auth Check Result:', authRes);

    if (authRes.challenge && authRes.challenge.detected) {
      sm.transition(WORKER_STATES.SECURITY_BLOCKED, `Challenge detected: ${authRes.challenge.type}`);
      console.log(`🔒 Instagram Status: SECURITY_BLOCKED (${authRes.challenge.type})`);
      return { status: 'SECURITY_BLOCKED', challenge: authRes.challenge.type };
    }

    if (authRes.authenticated) {
      sm.transition(WORKER_STATES.READY, 'Instagram authenticated successfully');
      console.log('✔ Instagram Status: READY (Authenticated)');
      return { status: 'VERIFIED', authenticated: true };
    } else {
      sm.transition(WORKER_STATES.AUTH_EXPIRED, authRes.reason || 'Login required');
      console.log('🟡 Instagram Status: AUTH_EXPIRED (Login Required)');
      return { status: 'AUTH_EXPIRED', reason: authRes.reason };
    }
  } catch (err) {
    console.error('Instagram Smoke Error:', err.message);
    sm.transition(WORKER_STATES.FAILED, err.message);
    return { status: 'FAILED', error: err.message };
  } finally {
    sm.transition(WORKER_STATES.STOPPING, 'Releasing browser and lock');
    await sessionManager.closeSession();
    sm.transition(WORKER_STATES.STOPPED, 'Session closed cleanly');
  }
}

if (require.main === module) {
  testLiveInstagram().then(res => {
    console.log('\nFinal Live Instagram Result:', res);
  }).catch(console.error);
}

module.exports = testLiveInstagram;
