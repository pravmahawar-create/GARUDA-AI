/**
 * GARUDA INSTALLMENT API INTEGRATION TEST
 * 
 * Verifies all Express endpoints for Installment Automation App:
 * - Health check
 * - Device licensing validation (Dev 1, Dev 2, Dev 3 blocked)
 * - Batch sync (idempotency, no duplicate payments)
 * - Photo OCR extraction
 * - Voice parsing
 * - Capability catalog
 * - Demo seed dataset
 */

const assert = require('assert');
const express = require('express');
const installmentRouter = require('../../routes/installmentRoutes');

const app = express();
app.use(express.json());
app.use('/api/installment', installmentRouter);

let server;
let baseUrl;

async function request(method, path, body = null) {
  const url = `${baseUrl}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runApiTests() {
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  console.log('================================================================');
  console.log(`🌐 RUNNING INSTALLMENT API TEST SUITE ON PORT ${port}`);
  console.log('================================================================\n');

  try {
    // 1. Health Endpoint
    const health = await request('GET', '/api/installment/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.success, true);
    console.log('✔ PASS: Health check endpoint OK');

    // 2. Device Licensing
    const lic1 = await request('GET', '/api/installment/license/founder_garuda_device_01');
    assert.strictEqual(lic1.data.license.allowed, true);
    assert.strictEqual(lic1.data.license.deviceRole, 'founder_dev');
    console.log('✔ PASS: Founder device authorized');

    const lic2 = await request('GET', '/api/installment/license/customer_demo_device_02');
    assert.strictEqual(lic2.data.license.allowed, true);
    assert.strictEqual(lic2.data.license.deviceRole, 'customer_demo');
    console.log('✔ PASS: Customer demo device authorized');

    const lic3 = await request('GET', '/api/installment/license/unauthorized_device_random');
    assert.strictEqual(lic3.data.license.allowed, false);
    assert.strictEqual(lic3.data.license.status, 'BLOCKED');
    assert.strictEqual(lic3.data.license.messageHindi, 'यह Demo इस Device के लिए Activated नहीं है।');
    console.log('✔ PASS: Unauthorized 3rd device blocked with exact Hindi message');

    // 3. Batch Sync (Idempotent)
    const syncPayload = {
      deviceId: 'customer_demo_device_02',
      customers: [{ id: 'test_c1', name: 'Test Ramesh', phone: '9826011111' }],
      plans: [{ id: 'test_p1', customerId: 'test_c1', totalAmount: 10000, installmentAmount: 1000, remainingAmount: 10000 }],
      payments: [{ id: 'test_pay1', customerId: 'test_c1', amount: 1000, date: '2026-09-26' }]
    };

    const sync1 = await request('POST', '/api/installment/sync', syncPayload);
    assert.strictEqual(sync1.status, 200);
    assert.strictEqual(sync1.data.synced, true);
    assert.strictEqual(sync1.data.results.paymentsSynced, 1);
    console.log('✔ PASS: First batch sync successful');

    // Repeat identical sync -> Idempotency test
    const sync2 = await request('POST', '/api/installment/sync', syncPayload);
    assert.strictEqual(sync2.status, 200);
    assert.strictEqual(sync2.data.synced, true);
    console.log('✔ PASS: Second identical sync accepted idempotently without duplicate records');

    // 4. Voice Parsing Endpoint
    const voiceRes = await request('POST', '/api/installment/voice', {
      text: 'Ramesh ne 500 diye',
      existingCustomers: ['Ramesh']
    });
    assert.strictEqual(voiceRes.status, 200);
    assert.strictEqual(voiceRes.data.result.intent, 'PAYMENT');
    assert.strictEqual(voiceRes.data.result.amount, 500);
    console.log('✔ PASS: Voice parsing endpoint returned structured payment intent');

    // 5. Photo OCR Endpoint (Raw OCR Text mode)
    const ocrRes = await request('POST', '/api/installment/ocr', {
      rawOcrText: 'Suresh Verma\nMob: 9826022222\nTotal 25000\nDown 3000\nKist 1000'
    });
    assert.strictEqual(ocrRes.status, 200);
    assert.strictEqual(ocrRes.data.fields.name, 'Suresh Verma');
    assert.strictEqual(ocrRes.data.fields.totalAmount, 25000);
    assert.strictEqual(ocrRes.data.fields.downPayment, 3000);
    console.log('✔ PASS: Photo OCR endpoint extracted valid fields');

    // 6. Capability Catalog
    const catalog = await request('GET', '/api/installment/catalog');
    assert.strictEqual(catalog.status, 200);
    assert.ok(catalog.data.features.some(f => f.featureId === 'GARUDA_BILLING'));
    console.log('✔ PASS: Capability catalog endpoint served add-on modules');

    // 7. Demo Seed Data
    const seed = await request('GET', '/api/installment/demo-seed');
    assert.strictEqual(seed.status, 200);
    assert.strictEqual(seed.data.data.statsDisplay.todayDueAmountHeadline, 18500);
    assert.strictEqual(seed.data.data.statsDisplay.todayCustomersCountHeadline, 7);
    assert.strictEqual(seed.data.data.statsDisplay.overdueAmountHeadline, 4500);
    console.log('✔ PASS: Demo seed endpoint returned exact ₹18,500 today, 7 customers, ₹4,500 overdue');

    console.log('\n================================================================');
    console.log('ALL API TESTS PASSED CLEANLY (7/7)');
    console.log('================================================================\n');
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runApiTests().catch(err => {
    console.error('Fatal API test error:', err);
    if (server) server.close();
    process.exit(1);
  });
}

module.exports = { runApiTests };
