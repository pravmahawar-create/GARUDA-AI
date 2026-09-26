/**
 * GARUDA KIST — VERNACULAR PARITY & LANGUAGE MATRIX TEST SUITE
 * 
 * Tests Section 18 requirements:
 * 1. English:
 *    - Home renders English
 *    - Payment modal English
 *    - Customer screen English
 *    - Receipt English
 *    - Capability drawer English
 * 2. Hinglish:
 *    - Home renders Hinglish
 *    - Payment modal Hinglish
 *    - Customer screen Hinglish
 *    - Receipt Hinglish
 *    - Capability drawer Hinglish
 * 3. Hindi:
 *    - Home renders Hindi
 *    - Payment modal Hindi
 *    - Customer screen Hindi
 *    - Receipt Hindi
 *    - Capability drawer Hindi
 * 4. Persistence Simulation:
 *    - Hinglish selection persists
 *    - Hindi selection persists
 *    - English selection persists
 * 5. Business Data & Money Invariance:
 *    - Numbers (₹18,500, ₹500, ₹4,500) never translated
 *    - Customer names (Ramesh Sharma) never translated
 */

const assert = require('assert');
const { getDictionary, translate, DICTIONARY } = require('./localization');
const { generatePaymentReceipt } = require('./receiptGenerator');
const { getCatalogFeatures, generateFeatureInquiryResponse } = require('./featureCatalog');

console.log('================================================================');
console.log('🌐 GARUDA KIST LANGUAGE MATRIX & VERNACULAR TEST SUITE');
console.log('================================================================\n');

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

// -------------------------------------------------------------
// 1. ENGLISH SUITE
// -------------------------------------------------------------
test('1. English: Home renders English labels', () => {
  const dict = getDictionary('en');
  assert.strictEqual(dict.todayCollection, "Today's Collection");
  assert.strictEqual(dict.customersDueToday, "Customers Due Today");
  assert.strictEqual(dict.paymentReceived, "Payment Received");
  assert.strictEqual(dict.today, "Today");
  assert.strictEqual(dict.customers, "Customers");
});

test('1. English: Payment modal renders English labels & success strings', () => {
  const dict = getDictionary('en');
  assert.strictEqual(dict.confirmPaymentTitle, "Payment Received");
  assert.strictEqual(dict.confirmPaymentBtn, "Confirm Payment");
  assert.strictEqual(dict.paymentSuccess('Ramesh', 500), "₹500 received from Ramesh");
  assert.strictEqual(dict.remainingBalanceText(4500), "Remaining Balance: ₹4,500");
});

test('1. English: Customer screen & add customer renders English', () => {
  const dict = getDictionary('en');
  assert.strictEqual(dict.allCustomers, "All Customers");
  assert.strictEqual(dict.addCustomer, "Add Customer");
  assert.strictEqual(dict.customerName, "Customer Name");
  assert.strictEqual(dict.phoneNumber, "Mobile Number");
  assert.strictEqual(dict.totalAmount, "Total Amount");
});

test('1. English: Receipt outputs exact Section 11 English specifications', () => {
  const receipt = generatePaymentReceipt({
    customerName: 'Ramesh',
    customerPhone: '9826011111',
    paymentAmount: 500,
    totalPlanAmount: 10000,
    totalPaidSoFar: 5500,
    remainingBalance: 4500,
    lang: 'en'
  });

  assert.ok(receipt.plainText.includes('Payment Receipt'));
  assert.ok(receipt.plainText.includes('Customer:'));
  assert.ok(receipt.plainText.includes('Ramesh'));
  assert.ok(receipt.plainText.includes('Amount Received: ₹500'));
  assert.ok(receipt.plainText.includes('Remaining: ₹4,500'));
  assert.ok(receipt.whatsappMessage.includes('Payment Receipt'));
  assert.ok(receipt.whatsappMessage.includes('Amount Received: ₹500'));
  assert.ok(receipt.whatsappMessage.includes('Remaining: ₹4,500'));
});

test('1. English: Capability drawer provides language-aware fields', () => {
  const catalog = getCatalogFeatures();
  const billing = catalog.find(f => f.featureId === 'GARUDA_BILLING');
  assert.strictEqual(billing.name.english, 'GST & Invoice Billing');
  assert.strictEqual(billing.nameEnglish, 'GST & Invoice Billing');
  assert.ok(billing.description.english.includes('GST invoice'));
});

// -------------------------------------------------------------
// 2. HINGLISH SUITE
// -------------------------------------------------------------
test('2. Hinglish: Home renders Hinglish labels', () => {
  const dict = getDictionary('hinglish');
  assert.strictEqual(dict.todayCollection, "Aaj Ka Collection");
  assert.strictEqual(dict.customersDueToday, "Customers Se Lena Hai");
  assert.strictEqual(dict.paymentReceived, "Paisa Mila");
  assert.strictEqual(dict.today, "Aaj");
});

test('2. Hinglish: Payment modal renders Hinglish labels & success strings', () => {
  const dict = getDictionary('hinglish');
  assert.strictEqual(dict.confirmPaymentTitle, "Paisa Mila");
  assert.strictEqual(dict.confirmPaymentBtn, "Payment Confirm Karein");
  assert.strictEqual(dict.paymentSuccess('Ramesh', 500), "Ramesh se ₹500 mil gaye");
  assert.strictEqual(dict.remainingBalanceText(4500), "Baaki: ₹4,500");
});

test('2. Hinglish: Customer screen & add customer renders Hinglish', () => {
  const dict = getDictionary('hinglish');
  assert.strictEqual(dict.allCustomers, "Sabhi Customers");
  assert.strictEqual(dict.addCustomer, "Customer Jodein");
  assert.strictEqual(dict.customerName, "Customer Ka Naam");
  assert.strictEqual(dict.save, "Save Karein");
});

test('2. Hinglish: Receipt outputs exact Section 11 Hinglish specifications', () => {
  const receipt = generatePaymentReceipt({
    customerName: 'Ramesh',
    customerPhone: '9826011111',
    paymentAmount: 500,
    totalPlanAmount: 10000,
    totalPaidSoFar: 5500,
    remainingBalance: 4500,
    lang: 'hinglish'
  });

  assert.ok(receipt.plainText.includes('Payment Receipt'));
  assert.ok(receipt.plainText.includes('Customer:'));
  assert.ok(receipt.plainText.includes('Ramesh'));
  assert.ok(receipt.plainText.includes('Paisa Mila: ₹500'));
  assert.ok(receipt.plainText.includes('Baaki: ₹4,500'));
  assert.ok(receipt.whatsappMessage.includes('Paisa Mila: ₹500'));
  assert.ok(receipt.whatsappMessage.includes('Baaki: ₹4,500'));
});

test('2. Hinglish: Capability drawer provides Hinglish fields', () => {
  const catalog = getCatalogFeatures();
  const billing = catalog.find(f => f.featureId === 'GARUDA_BILLING');
  assert.strictEqual(billing.name.hinglish, 'GST Aur Pakka Bill');
  assert.strictEqual(billing.nameHinglish, 'GST Aur Pakka Bill');
  assert.ok(billing.description.hinglish.includes('GST bill'));
});

// -------------------------------------------------------------
// 3. HINDI SUITE
// -------------------------------------------------------------
test('3. Hindi: Home renders Devanagari Hindi labels', () => {
  const dict = getDictionary('hi');
  assert.strictEqual(dict.todayCollection, "आज का कलेक्शन");
  assert.strictEqual(dict.customersDueToday, "ग्राहकों से लेना है");
  assert.strictEqual(dict.paymentReceived, "पैसा मिला");
  assert.strictEqual(dict.today, "आज");
  assert.strictEqual(dict.customers, "ग्राहक");
});

test('3. Hindi: Payment modal renders Devanagari Hindi labels & success strings', () => {
  const dict = getDictionary('hi');
  assert.strictEqual(dict.confirmPaymentTitle, "पैसा मिला");
  assert.strictEqual(dict.confirmPaymentBtn, "भुगतान की पुष्टि करें");
  assert.strictEqual(dict.paymentSuccess('रमेश', 500), "रमेश से ₹500 प्राप्त हुए");
  assert.strictEqual(dict.remainingBalanceText(4500), "बाकी राशि: ₹4,500");
});

test('3. Hindi: Customer screen & add customer renders Devanagari Hindi', () => {
  const dict = getDictionary('hi');
  assert.strictEqual(dict.allCustomers, "सभी ग्राहक");
  assert.strictEqual(dict.addCustomer, "ग्राहक जोड़ें");
  assert.strictEqual(dict.customerName, "ग्राहक का नाम");
  assert.strictEqual(dict.save, "सहेजें");
});

test('3. Hindi: Receipt outputs exact Section 11 Hindi specifications', () => {
  const receipt = generatePaymentReceipt({
    customerName: 'रमेश',
    customerPhone: '9826011111',
    paymentAmount: 500,
    totalPlanAmount: 10000,
    totalPaidSoFar: 5500,
    remainingBalance: 4500,
    lang: 'hi'
  });

  assert.ok(receipt.plainText.includes('भुगतान रसीद'));
  assert.ok(receipt.plainText.includes('ग्राहक:'));
  assert.ok(receipt.plainText.includes('रमेश'));
  assert.ok(receipt.plainText.includes('जमा राशि: ₹500'));
  assert.ok(receipt.plainText.includes('बाकी: ₹4,500'));
  assert.ok(receipt.whatsappMessage.includes('जमा राशि: ₹500'));
  assert.ok(receipt.whatsappMessage.includes('बाकी: ₹4,500'));
});

test('3. Hindi: Capability drawer provides Hindi fields', () => {
  const catalog = getCatalogFeatures();
  const billing = catalog.find(f => f.featureId === 'GARUDA_BILLING');
  assert.strictEqual(billing.name.hindi, 'GST एवं पक्का बिल (Billing Module)');
  assert.strictEqual(billing.nameHindi, 'GST एवं पक्का बिल (Billing Module)');
  assert.ok(billing.description.hindi.includes('GST बिल'));
});

// -------------------------------------------------------------
// 4. PERSISTENCE LIFECYCLE
// -------------------------------------------------------------
test('4. Persistence simulation: Select Hinglish -> reload preserves Hinglish', () => {
  let mockStorage = {};
  function setLang(l) { mockStorage['garuda_kist_lang'] = l; }
  function loadLang() { return mockStorage['garuda_kist_lang'] || 'en'; }

  setLang('hinglish');
  assert.strictEqual(loadLang(), 'hinglish');
  assert.strictEqual(getDictionary(loadLang()).paymentReceived, 'Paisa Mila');
});

test('4. Persistence simulation: Select Hindi -> reload preserves Hindi', () => {
  let mockStorage = {};
  function setLang(l) { mockStorage['garuda_kist_lang'] = l; }
  function loadLang() { return mockStorage['garuda_kist_lang'] || 'en'; }

  setLang('hi');
  assert.strictEqual(loadLang(), 'hi');
  assert.strictEqual(getDictionary(loadLang()).paymentReceived, 'पैसा मिला');
});

test('4. Persistence simulation: Select English -> reload preserves English', () => {
  let mockStorage = {};
  function setLang(l) { mockStorage['garuda_kist_lang'] = l; }
  function loadLang() { return mockStorage['garuda_kist_lang'] || 'en'; }

  setLang('en');
  assert.strictEqual(loadLang(), 'en');
  assert.strictEqual(getDictionary(loadLang()).paymentReceived, 'Payment Received');
});

// -------------------------------------------------------------
// 5. INVARIANCE PROTECTION
// -------------------------------------------------------------
test('5. Business data invariance: Customer name, phone, numbers never translated', () => {
  const customerName = 'Ramesh Sharma';
  const phone = '9826012345';
  const amount = 18500;

  ['en', 'hinglish', 'hi'].forEach(lang => {
    const dict = getDictionary(lang);
    const receipt = generatePaymentReceipt({
      customerName,
      customerPhone: phone,
      paymentAmount: 500,
      totalPlanAmount: amount,
      totalPaidSoFar: 500,
      remainingBalance: 18000,
      lang
    });

    assert.ok(receipt.plainText.includes(customerName), `Name must remain unchanged in ${lang}`);
    assert.ok(receipt.plainText.includes(phone), `Phone must remain unchanged in ${lang}`);
    assert.ok(receipt.plainText.includes('₹18,500'), `Money format must remain unchanged in ${lang}`);
  });
});

console.log('\n================================================================');
console.log(`LANGUAGE MATRIX SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
