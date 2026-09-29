/**
 * Live LinkedIn Controlled Smoke Test
 * Phase 3: Tests LinkedIn live state without circumvention or infinite retries.
 * If challenged/redirected, transitions safely to SECURITY_BLOCKED / FAILED (retryable: false).
 */

require('dotenv').config();
const SessionManager = require('../browser/sessionManager');
const LinkedInAdapter = require('../platforms/linkedin/linkedinAdapter');
const HealthMonitor = require('../core/healthMonitor');
const { WorkerStateMachine, WORKER_STATES } = require('../core/stateMachine');
const fs = require('fs');
const path = require('path');

async function testLiveLinkedIn() {
  console.log('====================================================');
  console.log('🦅 GARUDA SOCIAL ENGINE: LIVE LINKEDIN SMOKE TEST');
  console.log('====================================================\n');

  const cookies = [];
  if (process.env.LINKEDIN_LI_AT) {
    cookies.push({ name: 'li_at', value: process.env.LINKEDIN_LI_AT.trim(), domain: '.linkedin.com', path: '/' });
  }
  if (process.env.LINKEDIN_JSESSIONID) {
    cookies.push({ name: 'JSESSIONID', value: process.env.LINKEDIN_JSESSIONID.trim(), domain: '.linkedin.com', path: '/' });
  }

  const sm = new WorkerStateMachine('linkedin', (t) => {
    console.log(`▶ [Transition] ${t.from} -> ${t.to} (${t.reason})`);
  });

  const healthMonitor = new HealthMonitor('linkedin');
  const sessionManager = new SessionManager('linkedin', {
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

    const adapter = new LinkedInAdapter(sessionManager, healthMonitor);
    sm.transition(WORKER_STATES.AUTH_CHECK, 'Evaluating live authentication & challenges');

    const authRes = await adapter.verifyAuthentication(session.page);
    console.log('Auth Check Result:', authRes);

    if (authRes.challenge) {
      sm.transition(WORKER_STATES.SECURITY_BLOCKED, `Challenge detected: ${authRes.challenge.type}`);
      console.log(`🔒 LinkedIn Status: SECURITY_BLOCKED (${authRes.challenge.type})`);
      return { status: 'SECURITY_BLOCKED', challenge: authRes.challenge.type };
    }

    if (!authRes.authenticated && authRes.reason === 'TOO_MANY_REDIRECTS') {
      sm.transition(WORKER_STATES.FAILED, 'Cloudflare redirect challenge (cookie invalidated)');
      console.log('🔒 LinkedIn Status: FAILED (TOO_MANY_REDIRECTS / Challenge, non-retryable)');
      return { status: 'SECURITY_BLOCKED', reason: 'TOO_MANY_REDIRECTS' };
    }

    if (authRes.authenticated) {
      sm.transition(WORKER_STATES.READY, 'Authenticated successfully');
      console.log('✔ LinkedIn Status: READY (Authenticated)');
      return { status: 'VERIFIED', authenticated: true };
    } else {
      sm.transition(WORKER_STATES.AUTH_EXPIRED, authRes.reason || 'Login required');
      console.log('🟡 LinkedIn Status: AUTH_EXPIRED (Login Required)');
      return { status: 'AUTH_EXPIRED', reason: authRes.reason };
    }
  } catch (err) {
    console.error('LinkedIn Smoke Error:', err.message);
    sm.transition(WORKER_STATES.FAILED, err.message);
    return { status: 'FAILED', error: err.message };
  } finally {
    sm.transition(WORKER_STATES.STOPPING, 'Releasing browser and lock');
    await sessionManager.closeSession();
    sm.transition(WORKER_STATES.STOPPED, 'Session closed cleanly');
  }
}

if (require.main === module) {
  testLiveLinkedIn().then(res => {
    console.log('\nFinal Live LinkedIn Result:', res);
  }).catch(console.error);
}

module.exports = testLiveLinkedIn;
