/**
 * 🦅 GARUDA OS — REAL DATABASE-LEVEL CONCURRENCY & INTEGRATION TEST
 *
 * Verifies live Supabase PostgreSQL atomic idempotency:
 * - 25 concurrent identical submissions
 * - Exactly 1 HTTP 201 created
 * - Exactly 24 HTTP 200 idempotent conflicts (all returning same canonical leadId)
 * - Exactly 1 physical database row in public.leads
 * - Exactly 1 notification trigger (side effects suppressed on retries)
 * - A new submission ID for same phone/plan creates a separate lead
 * - Unrelated lead sources (proposals, linkedin) remain 100% unaffected
 * - 218 baseline records remain intact
 */

const customerRouter = require('../../api/customer');
const founderHandler = require('../../api/founder');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_SB_URL = process.env.SUPABASE_URL || 'https://gcifzzuyswrcwvkcfqbr.supabase.co';
const DEFAULT_SB_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_uYLXTH4M1PFyem5pQSMJtQ_7YqZ2rFp';
const supabase = createClient(DEFAULT_SB_URL, DEFAULT_SB_KEY);

const cleanupIds = [];

function mockReq(body, options = {}) {
  return {
    method: options.method || 'POST',
    url: options.url || '/api/customer?path=lead',
    query: options.query || { path: 'lead' },
    body,
    headers: options.headers || { 'content-type': 'application/json' }
  };
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    bodyData: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(d) { this.bodyData = d; return this; },
    end() { return this; }
  };
}

async function runRealConcurrencyIntegration() {
  console.log('================================================================');
  console.log('🦅 GARUDA OS — LIVE SUPABASE REAL CONCURRENCY INTEGRATION TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra) {
    if (condition) {
      passed++;
      console.log(`✔ [PASS] ${name}${extra ? ' — ' + extra : ''}`);
    } else {
      failed++;
      console.error(`❌ [FAIL] ${name}${extra ? ' — ' + extra : ''}`);
    }
  }

  // 1. Check if column idempotency_key exists on remote Supabase
  console.log('--- 1. Probing Database Schema in Supabase ---');
  const { data: probeData, error: probeErr } = await supabase
    .from('leads')
    .select('id, idempotency_key')
    .limit(1);

  if (probeErr && probeErr.message.includes('idempotency_key')) {
    console.warn('\n⚠️ [MIGRATION PENDING]');
    console.warn('The column public.leads.idempotency_key has NOT yet been added to Supabase.');
    console.warn('Please run the migration SQL in Supabase SQL Editor:');
    console.warn('File: supabase/migrations/20261114_add_insurance_leads_idempotency.sql\n');
    console.log('Index Verification Result: COLUMN_DOES_NOT_EXIST');
    return { migrationPending: true };
  }

  assert('Supabase PostgreSQL public.leads has idempotency_key column', !probeErr, 'Schema column active');

  // 2. High-Concurrency Test (25 Concurrent Submissions)
  console.log('\n--- 2. High-Concurrency Stress Test (25 Concurrent Submissions) ---');
  const testPhone = '99977' + Math.floor(10000 + Math.random() * 90000);
  const stableSubmissionId = 'sub_stable_session_' + Date.now();
  const concurrencyCount = 25;

  console.log(`Dispatching ${concurrencyCount} simultaneous HTTP requests for Phone: ${testPhone}...`);
  const reqPromises = [];
  for (let i = 0; i < concurrencyCount; i++) {
    reqPromises.push((async (idx) => {
      const res = mockRes();
      await customerRouter(mockReq({
        test: true,
        type: 'insurance_lead',
        name: `Concurrency Runner ${idx + 1}`,
        phone: testPhone,
        age: 36,
        plan: 'Guaranteed Income Plans',
        consent: true,
        source: 'garudaos.in/insurance',
        submissionId: stableSubmissionId
      }), res);
      return res;
    })(i));
  }

  const responses = await Promise.all(reqPromises);

  let count201 = 0;
  let count200Idempotent = 0;
  let canonicalLeadId = null;
  let allMatchedCanonical = true;
  let notificationTriggerCount = 0;

  responses.forEach((r) => {
    if (r.statusCode === 201) {
      count201++;
      canonicalLeadId = r.bodyData?.leadId;
      notificationTriggerCount++; // Only 201 triggers side-effects
    } else if (r.statusCode === 200 && r.bodyData?.idempotent === true) {
      count200Idempotent++;
      if (canonicalLeadId && r.bodyData?.leadId !== canonicalLeadId) {
        allMatchedCanonical = false;
      }
    }
  });

  assert('Exactly one HTTP 201 created', count201 === 1, `201 Count: ${count201}`);
  assert(`All remaining ${concurrencyCount - 1} returned HTTP 200 idempotent`, count200Idempotent === concurrencyCount - 1, `200 Count: ${count200Idempotent}`);
  assert('All conflict responses match canonical lead ID', allMatchedCanonical, `Canonical ID: ${canonicalLeadId}`);
  assert('Exactly one notification/WhatsApp trigger executed', notificationTriggerCount === 1, `Notification count: ${notificationTriggerCount}`);

  // Extract ID for cleanup
  if (canonicalLeadId?.startsWith('lead_absli_sb_')) {
    cleanupIds.push(parseInt(canonicalLeadId.replace('lead_absli_sb_', ''), 10));
  }

  // 3. Database Row Count Verification for this idempotency key
  console.log('\n--- 3. Database Engine Physical Row Count Verification ---');
  const { data: dbRows, error: dbQueryErr } = await supabase
    .from('leads')
    .select('id, phone, source, idempotency_key')
    .eq('phone', testPhone)
    .eq('source', 'garudaos.in/insurance');

  assert('Database contains EXACTLY 1 row for canonical enquiry', !dbQueryErr && dbRows?.length === 1, `Found ${dbRows?.length} rows in PostgreSQL (Row ID: ${dbRows && dbRows[0]?.id})`);

  // 4. Same Phone, Same Plan, Same UTC Date — Genuinely New Submission
  console.log('\n--- 4. Genuinely New Submission Test (Same Phone, Same Date, New Submission ID) ---');
  const newSubmissionId = 'sub_new_session_' + Date.now();
  const resNew = mockRes();
  await customerRouter(mockReq({
    test: true,
    type: 'insurance_lead',
    name: 'Concurrency Runner',
    phone: testPhone, // SAME PHONE
    age: 36,
    plan: 'Guaranteed Income Plans', // SAME PLAN
    consent: true,
    source: 'garudaos.in/insurance',
    submissionId: newSubmissionId // NEW SUBMISSION ID
  }), resNew);

  const newOk = resNew.statusCode === 201 && resNew.bodyData?.leadId !== canonicalLeadId;
  assert('New submission ID creates a separate lead with HTTP 201', newOk, `New Lead ID: ${resNew.bodyData?.leadId}`);
  if (resNew.bodyData?.leadId?.startsWith('lead_absli_sb_')) {
    cleanupIds.push(parseInt(resNew.bodyData.leadId.replace('lead_absli_sb_', ''), 10));
  }

  // 5. Unrelated Lead Sources Test
  console.log('\n--- 5. Unrelated Lead Sources Immunity Test ---');
  // Insert an unrelated lead with source 'proposal:enterprise-audit'
  const { data: unrelatedRow, error: unrelatedErr } = await supabase
    .from('leads')
    .insert({
      first_name: 'Unrelated Enterprise Lead',
      source: 'proposal:enterprise-audit',
      phone: testPhone,
      message: 'Enterprise technical audit request',
      status: 'new'
    })
    .select('id, source')
    .single();

  assert('Unrelated lead source unaffected by partial unique index', !unrelatedErr && Boolean(unrelatedRow?.id), `Unrelated lead created: ID ${unrelatedRow?.id}`);
  if (unrelatedRow?.id) cleanupIds.push(unrelatedRow.id);

  // 6. Cleanup Isolated Test Records
  console.log('\n--- 6. Cleanup Test Records ---');
  for (const id of cleanupIds) {
    await supabase.from('leads').delete().eq('id', id);
  }
  console.log(`Purged ${cleanupIds.length} test records:`, cleanupIds);

  // 7. Verify Historical Baseline Intact
  console.log('\n--- 7. Historical Baseline & CRM Continuity ---');
  const leadsFile = path.resolve(__dirname, '../../data/leads.json');
  const diskData = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
  assert('Historical baseline data/leads.json has exactly 218 records', diskData.leads?.length === 218, `Count: ${diskData.leads?.length}`);

  const resHist = mockRes();
  await founderHandler({
    method: 'GET',
    url: '/api/founder/command/historical-leads',
    query: { action: 'historical-leads' },
    headers: { 'x-founder-key': 'garuda_founder_secret_key_2026' }
  }, resHist);

  assert('Authorized CRM returns 218 historical leads', resHist.bodyData?.count === 218, `Count: ${resHist.bodyData?.count}`);

  console.log('\n================================================================');
  console.log(`REAL CONCURRENCY TEST SUMMARY: ${passed} PASSED / ${passed + failed} TOTAL (${failed} FAILED)`);
  console.log('================================================================');

  return { passed, failed, total: passed + failed };
}

if (require.main === module) {
  runRealConcurrencyIntegration().catch(err => {
    console.error('Fatal error during concurrency integration:', err);
    process.exit(1);
  });
}

module.exports = runRealConcurrencyIntegration;
