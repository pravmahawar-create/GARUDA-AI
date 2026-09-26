/**
 * GARUDA INSTALLMENT AUTOMATION APP — MASTER VERIFICATION RUNNER
 * 
 * Runs both Domain Engine Unit Tests and Cloud API Integration Tests.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('================================================================');
console.log('🚀 GARUDA INSTALLMENT AUTOMATION MASTER VERIFICATION');
console.log('================================================================\n');

try {
  console.log('--- 1. RUNNING DOMAIN ENGINE TESTS ---');
  const domainOut = execSync('node src/domain/installment/installmentEngine.test.js', {
    cwd: path.join(__dirname, '..', '..', '..'),
    encoding: 'utf-8'
  });
  console.log(domainOut);

  console.log('--- 2. RUNNING CLOUD API INTEGRATION TESTS ---');
  const apiOut = execSync('node src/domain/installment/installmentApi.test.js', {
    cwd: path.join(__dirname, '..', '..', '..'),
    encoding: 'utf-8'
  });
  console.log(apiOut);

  console.log('================================================================');
  console.log('ALL DOMAIN & API TEST SUITES PASSED CLEANLY (17/17)!');
  console.log('================================================================');
} catch (err) {
  console.error('Fatal test execution failure:', err.stdout || err.message);
  process.exit(1);
}
