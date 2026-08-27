const { REVENUE_STATES, RevenueExecutionAdapter } = require('./revenueExecutionAdapter');

async function runPhase6Tests() {
  console.log('🧪 Starting GARUDA Phase 6 Revenue Execution & Payment Verification Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  const adapter = new RevenueExecutionAdapter();

  // -------------------------------------------------------------
  // 1. OPPORTUNITY CONTRACT & WORK COMPLETION TESTS
  // -------------------------------------------------------------
  console.log('--- 1. WORK COMPLETION & SEPARATION TESTS ---');

  // Test 1: Real opportunity contract works & records WORK_COMPLETED
  const opp = { id: 'opp-101', status: REVENUE_STATES.EXECUTING };
  const workRes = adapter.recordWorkCompletion(opp);
  assert(workRes.success === true && workRes.status === REVENUE_STATES.WORK_COMPLETED, 'Real opportunity records WORK_COMPLETED');

  // Test 2: Fake/invalid opportunity rejected
  const fakeRes = adapter.recordWorkCompletion(null);
  assert(fakeRes.success === false && fakeRes.errorCode === 'INVALID_OPPORTUNITY', 'Fake opportunity rejected');

  // Test 3: Delivery recorded separately from work completion
  const delRes = adapter.submitDelivery(workRes, [{ reference: 'garuda://artifact/101', sha256: 'a'.repeat(64) }]);
  assert(delRes.success === true && delRes.status === REVENUE_STATES.DELIVERY_SUBMITTED, 'Delivery recorded separately as DELIVERY_SUBMITTED');

  // -------------------------------------------------------------
  // 2. CLIENT ACCEPTANCE & PAYMENT VERIFICATION TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. CLIENT ACCEPTANCE & AUTHORITATIVE PAYMENT TESTS ---');

  // Test 4: Client acceptance recorded separately from delivery
  const accRes = adapter.recordClientAcceptance(delRes, { accepted: true, feedback: 'Approved' });
  assert(accRes.success === true && accRes.status === REVENUE_STATES.CLIENT_ACCEPTED, 'Client acceptance recorded separately as CLIENT_ACCEPTED');

  // Test 5: Payment is NOT assumed without signature verification
  const unauthPay = adapter.verifyPayment(accRes, { paymentId: 'pay_123', amount: 5000, signatureVerified: false });
  assert(unauthPay.success === false && unauthPay.errorCode === 'UNAUTHORITATIVE_PAYMENT', 'Unauthoritative payment without signature verification rejected');

  // Test 6: Authoritative payment verification succeeds
  const authPay = adapter.verifyPayment(accRes, { paymentId: 'pay_123', amount: 5000, currency: 'INR', signatureVerified: true });
  assert(authPay.success === true && authPay.status === REVENUE_STATES.PAYMENT_VERIFIED, 'Authoritative payment verification succeeds');

  // Test 7: Duplicate payment ID blocked to prevent double-counting revenue
  const dupPay = adapter.verifyPayment(accRes, { paymentId: 'pay_123', amount: 5000, currency: 'INR', signatureVerified: true });
  assert(dupPay.success === false && dupPay.errorCode === 'DUPLICATE_PAYMENT_BLOCKED', 'Duplicate payment ID blocked to prevent double-counting revenue');

  // Test 8: Invalid state transition blocked
  const invalidTrans = adapter.recordClientAcceptance({ status: REVENUE_STATES.EXECUTING }, { accepted: true });
  assert(invalidTrans.success === false && invalidTrans.errorCode === 'INVALID_STATE_TRANSITION', 'Invalid state transition blocked');

  console.log(`\n📊 Phase 6 Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPhase6Tests();
}

module.exports = runPhase6Tests;
