/**
 * GARUDA INSTALLMENT AUTOMATION ROUTES
 * 
 * Express endpoints for:
 * - Device licensing validation
 * - Cloud batch synchronization (idempotent)
 * - Photo OCR extraction
 * - Voice command parsing
 * - Capability catalog & add-on inquiries
 * - Seed demo dataset
 */

const express = require('express');
const router = express.Router();
const installmentService = require('../services/installmentService');

// Health Check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'GARUDA Installment Automation Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Device License Validation
router.get('/license/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const result = installmentService.validateDeviceLicense({ deviceId });
  res.json({
    success: true,
    license: result
  });
});

// Subscription Status
router.get('/subscription', (req, res) => {
  const { start, end } = req.query;
  const result = installmentService.evaluateSubscriptionStatus({
    subscriptionStartDate: start || '2026-09-01',
    subscriptionEndDate: end || '2027-09-01'
  });
  res.json({
    success: true,
    subscription: result
  });
});

// Cloud Batch Sync (Idempotent)
router.post('/sync', async (req, res) => {
  try {
    const { deviceId, customers, plans, payments } = req.body;
    if (!deviceId) {
      return res.status(400).json({ success: false, error: 'deviceId is required for sync' });
    }

    const syncResult = await installmentService.syncBatch({
      deviceId,
      customers: customers || [],
      plans: plans || [],
      payments: payments || []
    });

    res.json(syncResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Photo OCR Extraction
router.post('/ocr', async (req, res) => {
  try {
    const { imageBase64, mimeType, rawOcrText } = req.body;
    const result = await installmentService.extractRecordFromPhoto({
      imageBase64,
      mimeType,
      rawOcrText
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Voice Intent Processing
router.post('/voice', (req, res) => {
  try {
    const { text, existingCustomers } = req.body;
    const result = installmentService.parseVoiceCommand(text, existingCustomers || []);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Capability Catalog (Side panel add-ons)
router.get('/catalog', (req, res) => {
  const features = installmentService.getCatalogFeatures();
  res.json({ success: true, features });
});

// Add-on inquiry
router.post('/catalog/inquire', (req, res) => {
  const { featureId, lang } = req.body;
  const inquiry = installmentService.generateFeatureInquiryResponse(featureId, lang || req.query.lang || 'hi');
  res.json(inquiry);
});

// Demo seed dataset
router.get('/demo-seed', (req, res) => {
  const seed = installmentService.getDemoSeedData();
  res.json({ success: true, data: seed });
});

module.exports = router;
