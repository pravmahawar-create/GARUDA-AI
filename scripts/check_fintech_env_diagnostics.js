require('dotenv').config();
const razorpayService = require('../src/services/razorpayPaymentLinkService');

const env = process.env;

console.log('=== RAZORPAY ENVIRONMENT DIAGNOSTICS ===');
console.log('RAZORPAY_LIVE_ENABLED:', env.RAZORPAY_LIVE_ENABLED);
console.log('RAZORPAY_KEY_ID_TEST exists:', Boolean(env.RAZORPAY_KEY_ID_TEST), env.RAZORPAY_KEY_ID_TEST ? env.RAZORPAY_KEY_ID_TEST.slice(0, 8) + '...' : 'none');
console.log('RAZORPAY_KEY_SECRET_TEST exists:', Boolean(env.RAZORPAY_KEY_SECRET_TEST));
console.log('RAZORPAY_WEBHOOK_SECRET_TEST exists:', Boolean(env.RAZORPAY_WEBHOOK_SECRET_TEST));
console.log('RAZORPAY_KEY_ID_LIVE exists:', Boolean(env.RAZORPAY_KEY_ID_LIVE));
console.log('RAZORPAY_KEY_SECRET_LIVE exists:', Boolean(env.RAZORPAY_KEY_SECRET_LIVE));
console.log('RAZORPAY_WEBHOOK_SECRET_LIVE exists:', Boolean(env.RAZORPAY_WEBHOOK_SECRET_LIVE));

try {
  const providerConfig = razorpayService.__testHook ? razorpayService.__testHook.getProviderConfig() : null;
  console.log('Provider Config:', providerConfig);
} catch (e) {
  console.log('Hook error:', e.message);
}

console.log('\n=== OTHER PROVIDERS DIAGNOSTICS ===');
console.log('ICICI_CORP_ID exists:', Boolean(env.ICICI_CORP_ID));
console.log('WIO_API_KEY exists:', Boolean(env.WIO_API_KEY));
console.log('MODULR_API_TOKEN exists:', Boolean(env.MODULR_API_TOKEN));
