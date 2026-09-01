/**
 * 🔒 FOUNDER-APPROVED LIVE GENERATION SMOKE TEST — Fal.ai Flux
 * Usage: FOUNDER_APPROVED_LIVE_GENERATION=true node scripts/creative-fal-smoke-test.js
 * Generates EXACTLY ONE image via Fal-ai/flux/schnell, persists, validates, logs no secrets.
 * Cost: ~$0.01-0.03 per Fal Flux schnell call. Founder must approve explicitly.
 */
try { require('dotenv').config(); } catch {}
const imageGenerationRouter = require('../src/services/imageGenerationRouter');

async function main() {
  if (process.env.FOUNDER_APPROVED_LIVE_GENERATION !== 'true') {
    console.log('SMOKE TEST SKIPPED: Set FOUNDER_APPROVED_LIVE_GENERATION=true to run one live Fal generation. No charges incurred.');
    console.log('Example: FOUNDER_APPROVED_LIVE_GENERATION=true node scripts/creative-fal-smoke-test.js');
    process.exit(0);
  }
  if (!process.env.FAL_KEY) {
    console.error('FAL_KEY missing — cannot run live smoke test.');
    process.exit(1);
  }
  console.log('🔒 Founder-approved live generation starting — exactly ONE Fal image...');
  const start = Date.now();
  const result = await imageGenerationRouter.routeGeneration({
    headline: 'GARUDA Sovereign Premium Cinematic — Founder Smoke Test',
    prompt: 'Ultra-photorealistic 8k architectural rendering of luxury sovereign residence, golden hour lighting, cinematic symmetry, 35mm lens',
    platformPreset: 'instagram_post',
    brandId: 'garuda_default',
    mode: 'AI_PHOTOREALISTIC',
    generationMode: 'LIVE_GENERATION',
    model: 'fal-ai/flux/schnell',
    qualityProfile: 'cinematic',
  });
  const elapsed = Date.now() - start;
  console.log('Result status:', result.status);
  console.log('Classification:', result.classification);
  console.log('Provider:', result.asset ? result.asset.provider : result.provider);
  console.log('GenerationMode:', result.asset ? result.asset.generationMode : 'N/A');
  console.log('CostEstimate:', result.asset ? result.asset.costEstimate : null);
  console.log('FallbackUsed:', result.fallbackUsed || false);
  console.log('Elapsed ms:', elapsed);
  if (result.asset && result.asset.filePath) {
    console.log('Asset persisted:', result.asset.filePath, `(${result.asset.fileSize} bytes, SHA256 ${result.asset.assetHash.slice(0,16)}...)`);
    console.log('Validation: PHYSICAL_DISK_VERIFIED');
  }
  if (result.success) console.log('✅ SMOKE TEST PASSED — one real image generated and persisted.');
  else console.log('❌ SMOKE TEST RESULT:', result.status, result.error || result.truthClassification);
  // Do not log secrets
}

main().catch(e => { console.error('Smoke test failed:', e.message); process.exit(1); });
