/**
 * GARUDA INSTALLMENT AUTOMATION APP — COMPREHENSIVE DOMAIN TEST MATRIX
 * 
 * Verifies all mathematical invariants and domain rules:
 * - 1. Plan & Schedule calculation
 * - 2. Payment application & remaining balance calculation
 * - 3. Partial payments & overpayments
 * - 4. Overdue detection
 * - 5. Daily collection reconciliation: SUM(customer due) === daily total
 * - 6. Total - Payments === Remaining under all scenarios
 * - 7. Voice intent extraction for Hindi/Hinglish
 * - 8. Photo OCR parser for handwritten notes
 * - 9. Device licensing: Allows Dev 1 & Dev 2, blocks Dev 3
 * - 10. Subscription expiry behavior (never deletes data)
 * - 11. Feature catalog separation (Billing is separate add-on)
 */

const assert = require('assert');
const {
  calculateInstallmentPlan,
  generateSchedule,
  applyPaymentsToPlan,
  calculateDailyCollection,
  formatCurrency,
  addDays
} = require('./installmentEngine');

const { parseVoiceCommand, extractAmount } = require('./voiceIntentParser');
const { parseOcrText } = require('./photoOcrParser');
const { validateDeviceLicense } = require('./deviceLicensing');
const { evaluateSubscriptionStatus } = require('./subscriptionEngine');
const { getCatalogFeatures } = require('./featureCatalog');
const { generatePaymentReceipt } = require('./receiptGenerator');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✔ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`, err.message);
    failCount++;
  }
}

console.log('================================================================');
console.log('🧪 GARUDA INSTALLMENT DOMAIN ENGINE TEST SUITE');
console.log('================================================================\n');

// 1. Plan Calculation & Schedule Generation
test('1. Plan calculation creates correct weekly schedule', () => {
  const plan = calculateInstallmentPlan({
    totalAmount: 30000,
    downPayment: 5000,
    installmentAmount: 1000,
    frequency: 'weekly',
    startDate: '2026-09-01'
  });

  assert.strictEqual(plan.totalAmount, 30000);
  assert.strictEqual(plan.downPayment, 5000);
  assert.strictEqual(plan.remainingAmount, 25000);
  assert.strictEqual(plan.totalInstallments, 25);

  const schedule = generateSchedule({
    remainingAmount: plan.remainingAmount,
    installmentAmount: plan.installmentAmount,
    frequency: 'weekly',
    startDate: plan.startDate
  });

  assert.strictEqual(schedule.length, 25);
  assert.strictEqual(schedule[0].dueDate, '2026-09-01');
  assert.strictEqual(schedule[1].dueDate, '2026-09-08');
  assert.strictEqual(schedule[24].dueDate, addDays('2026-09-01', 24 * 7));
  const totalScheduleExpected = schedule.reduce((s, i) => s + i.expectedAmount, 0);
  assert.strictEqual(totalScheduleExpected, 25000);
});

// 2. Mathematical Invariant: Total - Payments === Remaining
test('2. Mathematical Invariant: Total - Payments === Remaining', () => {
  const plan = calculateInstallmentPlan({
    totalAmount: 10000,
    downPayment: 2000,
    installmentAmount: 1000,
    frequency: 'daily',
    startDate: '2026-09-01'
  });

  const payments = [
    { amount: 1000, date: '2026-09-01' },
    { amount: 500, date: '2026-09-02' },  // partial payment
    { amount: 1500, date: '2026-09-03' }  // overpayment
  ];

  const evalResult = applyPaymentsToPlan(plan, payments, '2026-09-04');
  const sumPayments = payments.reduce((s, p) => s + p.amount, 0);

  assert.strictEqual(evalResult.totalPaid, plan.downPayment + sumPayments);
  assert.strictEqual(evalResult.remainingAmount, plan.totalAmount - (plan.downPayment + sumPayments));
  assert.strictEqual(evalResult.remainingAmount, 5000);
});

// 3. Partial payment and Overdue detection
test('3. Partial payments properly advance schedule and detect overdue', () => {
  const plan = calculateInstallmentPlan({
    totalAmount: 5000,
    downPayment: 0,
    installmentAmount: 1000,
    frequency: 'weekly',
    startDate: '2026-09-01'
  });

  // Pay only 400 on first installment
  const payments = [{ amount: 400, date: '2026-09-01' }];
  // As of 2026-09-10 (after 2026-09-01 and 2026-09-08), 1st installment has 600 overdue, 2nd has 1000 overdue
  const evalResult = applyPaymentsToPlan(plan, payments, '2026-09-10');

  assert.strictEqual(evalResult.isOverdue, true);
  assert.strictEqual(evalResult.overdueAmount, 1600); // 600 + 1000
  assert.strictEqual(evalResult.nextDueDate, '2026-09-01');
  assert.strictEqual(evalResult.nextDueAmount, 600);
});

// 4. Daily Collection Invariant: SUM(customer due) === daily total
test('4. Daily Collection Invariant: SUM(customer dues) === daily collection total', () => {
  const customers = [
    { id: 'c1', name: 'Ramesh', phone: '9826011111' },
    { id: 'c2', name: 'Suresh', phone: '9826022222' },
    { id: 'c3', name: 'Mohan', phone: '9826033333' }
  ];

  const plans = [
    { customerId: 'c1', totalAmount: 10000, downPayment: 0, installmentAmount: 500, frequency: 'daily', startDate: '2026-09-26', status: 'active' },
    { customerId: 'c2', totalAmount: 20000, downPayment: 0, installmentAmount: 1000, frequency: 'weekly', startDate: '2026-09-26', status: 'active' },
    { customerId: 'c3', totalAmount: 15000, downPayment: 0, installmentAmount: 2000, frequency: 'monthly', startDate: '2026-09-26', status: 'active' }
  ];

  const payments = [];
  const targetDate = '2026-09-26';

  const daily = calculateDailyCollection({ customers, plans, payments, targetDate });

  assert.strictEqual(daily.totalCustomerCount, 3);
  assert.strictEqual(daily.today.customerCount, 3);
  // Expected total: 500 + 1000 + 2000 = 3500
  assert.strictEqual(daily.today.expectedAmount, 3500);

  const sumCustomerExpected = daily.today.customers.reduce((s, c) => s + c.expectedAmount, 0);
  assert.strictEqual(daily.today.expectedAmount, sumCustomerExpected);
});

// 5. Voice Intent Parser for Hindi / Hinglish
test('5. Voice intent correctly parses Hindi/Hinglish collection commands', () => {
  const existingNames = ['Ramesh', 'Suresh', 'Mohan', 'Anita'];

  const r1 = parseVoiceCommand('Ramesh ne 500 diye', existingNames);
  assert.strictEqual(r1.intent, 'PAYMENT');
  assert.strictEqual(r1.customerName, 'Ramesh');
  assert.strictEqual(r1.amount, 500);
  assert.strictEqual(r1.paymentMode, 'cash');
  assert.strictEqual(r1.confidence >= 0.9, true);

  const r2 = parseVoiceCommand('Suresh ke 1000 upi jama karo', existingNames);
  assert.strictEqual(r2.intent, 'PAYMENT');
  assert.strictEqual(r2.customerName, 'Suresh');
  assert.strictEqual(r2.amount, 1000);
  assert.strictEqual(r2.paymentMode, 'upi');

  const r3 = parseVoiceCommand('Mohan ka hisaab dikhao', existingNames);
  assert.strictEqual(r3.intent, 'VIEW_CUSTOMER');
  assert.strictEqual(r3.customerName, 'Mohan');
});

// 6. Photo OCR Text Extraction & Mathematical Validation
test('6. Photo OCR extracts structured fields and validates Total - Down === Remaining', () => {
  const rawHandwrittenNote = `
    Ramesh Sharma
    Mob: 9826098765
    Total 30,000
    Down payment 5,000
    Kist 1,000 weekly
    Somwar
  `;

  const ocrResult = parseOcrText(rawHandwrittenNote);
  assert.strictEqual(ocrResult.success, true);
  assert.strictEqual(ocrResult.fields.name, 'Ramesh Sharma');
  assert.strictEqual(ocrResult.fields.phone, '9826098765');
  assert.strictEqual(ocrResult.fields.totalAmount, 30000);
  assert.strictEqual(ocrResult.fields.downPayment, 5000);
  assert.strictEqual(ocrResult.fields.installmentAmount, 1000);
  assert.strictEqual(ocrResult.fields.frequency, 'weekly');
  assert.strictEqual(ocrResult.fields.preferredDay, 'Monday');
  assert.strictEqual(ocrResult.fields.remainingAmount, 25000);
});

// 7. Demo Device Licensing: Allows Dev 1 & Dev 2, blocks Dev 3
test('7. Device licensing: Allows Device 1 & Device 2, blocks Device 3', () => {
  const dev1 = validateDeviceLicense({ deviceId: 'founder_garuda_device_01' });
  assert.strictEqual(dev1.allowed, true);
  assert.strictEqual(dev1.deviceRole, 'founder_dev');

  const dev2 = validateDeviceLicense({ deviceId: 'customer_demo_device_02' });
  assert.strictEqual(dev2.allowed, true);
  assert.strictEqual(dev2.deviceRole, 'customer_demo');

  const dev3 = validateDeviceLicense({ deviceId: 'unauthorized_device_random_999' });
  assert.strictEqual(dev3.allowed, false);
  assert.strictEqual(dev3.status, 'BLOCKED');
  assert.strictEqual(dev3.messageHindi, 'यह Demo इस Device के लिए Activated नहीं है।');
});

// 8. Subscription Expiry: Never deletes data, keeps history readable
test('8. Subscription engine enforces non-destructive policy', () => {
  // Active subscription
  const subActive = evaluateSubscriptionStatus({
    subscriptionStartDate: '2026-01-01',
    subscriptionEndDate: '2027-01-01',
    currentDate: '2026-09-26'
  });
  assert.strictEqual(subActive.status, 'ACTIVE');
  assert.strictEqual(subActive.canCreateEntries, true);
  assert.strictEqual(subActive.canReadHistory, true);
  assert.strictEqual(subActive.canSyncCloud, true);

  // Expired subscription
  const subExpired = evaluateSubscriptionStatus({
    subscriptionStartDate: '2025-01-01',
    subscriptionEndDate: '2026-01-01',
    currentDate: '2026-09-26'
  });
  assert.strictEqual(subExpired.status, 'EXPIRED');
  assert.strictEqual(subExpired.canReadHistory, true);      // Non-destructive: History MUST remain readable
  assert.strictEqual(subExpired.canCreateEntries, false);   // Creation paused
  assert.strictEqual(subExpired.canSyncCloud, false);       // Cloud sync paused
});

// 9. Feature Catalog: Billing is separate add-on, not in ₹12k core scope
test('9. Feature catalog: Billing is separate add-on with separate pricing', () => {
  const catalog = getCatalogFeatures();
  const billingFeature = catalog.find(f => f.featureId === 'GARUDA_BILLING');

  assert.ok(billingFeature, 'Billing feature must exist in catalog');
  assert.strictEqual(billingFeature.inCoreScope, false, 'Billing must NOT be in ₹12,000 core scope');
  assert.strictEqual(billingFeature.price, 4999);
  assert.strictEqual(billingFeature.status, 'AVAILABLE_ADDON');
});

// 10. Receipt Generator: Formats clean thermal receipt & WhatsApp text
test('10. Receipt generator outputs valid thermal print text & WhatsApp text', () => {
  const receipt = generatePaymentReceipt({
    customerName: 'Ramesh Sharma',
    customerPhone: '9826012345',
    paymentAmount: 500,
    totalPlanAmount: 30000,
    totalPaidSoFar: 25500,
    remainingBalance: 4500,
    nextDueDate: '2026-10-05',
    nextDueAmount: 500
  });

  assert.ok(receipt.plainText.includes('रसीद सं.'));
  assert.ok(receipt.plainText.includes('Ramesh Sharma'));
  assert.ok(receipt.plainText.includes('₹500'));
  assert.ok(receipt.whatsappMessage.includes('किस्त रसीद'));
  assert.ok(receipt.html.includes('PAYMENT RECEIPT'));
});

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
