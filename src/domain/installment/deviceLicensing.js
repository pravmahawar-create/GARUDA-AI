/**
 * GARUDA DEMO DEVICE LICENSING ENGINE
 * 
 * Strict Enforcement:
 * - Device 1: Founder/Developer device ('founder_dev')
 * - Device 2: Customer demo device ('customer_demo')
 * - Third/other devices: BLOCKED with message:
 *   "यह Demo इस Device के लिए Activated नहीं है।"
 * 
 * Tracks:
 * - type: 'DEMO' | 'PRODUCTION'
 * - status: 'ACTIVE' | 'EXPIRED' | 'BLOCKED'
 */

const crypto = require('crypto');

// Pre-authorized demo devices
const AUTHORIZED_DEVICES = new Map([
  [
    'founder_garuda_device_01',
    {
      deviceId: 'founder_garuda_device_01',
      deviceRole: 'founder_dev',
      label: 'Founder Praveen Dev Device',
      type: 'DEMO',
      status: 'ACTIVE',
      activatedAt: '2026-09-01T00:00:00.000Z',
      expiresAt: '2027-12-31T23:59:59.000Z'
    }
  ],
  [
    'customer_demo_device_02',
    {
      deviceId: 'customer_demo_device_02',
      deviceRole: 'customer_demo',
      label: 'Authorized Customer Demo Unit',
      type: 'DEMO',
      status: 'ACTIVE',
      activatedAt: '2026-09-20T00:00:00.000Z',
      expiresAt: '2026-10-31T23:59:59.000Z'
    }
  ]
]);

// Dynamic registration cache for device fingerprinting
const activeDeviceRegistry = new Map(AUTHORIZED_DEVICES);

/**
 * Validates whether a device is licensed to run the app.
 */
function validateDeviceLicense({
  deviceId,
  licenseKey = null,
  currentDate = new Date()
}) {
  if (!deviceId || typeof deviceId !== 'string') {
    return {
      allowed: false,
      status: 'BLOCKED',
      reason: 'INVALID_DEVICE_ID',
      messageHindi: 'अमान्य डिवाइस पहचान (Invalid Device ID)'
    };
  }

  const normId = deviceId.trim();

  // Check if device is registered in pre-authorized pool
  const device = activeDeviceRegistry.get(normId);

  if (!device) {
    return {
      allowed: false,
      status: 'BLOCKED',
      deviceId: normId,
      reason: 'UNAUTHORIZED_DEVICE',
      messageHindi: 'यह Demo इस Device के लिए Activated नहीं है।'
    };
  }

  // Check status
  if (device.status === 'BLOCKED') {
    return {
      allowed: false,
      status: 'BLOCKED',
      deviceId: normId,
      reason: 'DEVICE_REVOKED',
      messageHindi: 'यह डिवाइस लाइसेंस निरस्त (Blocked) कर दिया गया है।'
    };
  }

  // Check expiration
  const expDate = new Date(device.expiresAt);
  if (currentDate > expDate) {
    return {
      allowed: false,
      status: 'EXPIRED',
      deviceId: normId,
      reason: 'LICENSE_EXPIRED',
      messageHindi: 'यह Demo लाइसेंस समाप्त (Expired) हो गया है। कृपया नवीनीकरण करें।'
    };
  }

  return {
    allowed: true,
    status: device.status,
    type: device.type,
    deviceRole: device.deviceRole,
    label: device.label,
    expiresAt: device.expiresAt,
    messageHindi: 'डिवाइस अधिकृत है (License Active)'
  };
}

/**
 * Generates an anonymous, non-invasive installation fingerprint
 * based on app instance creation timestamp and random salt.
 */
function generateAppInstanceId(salt = 'garuda_kist_salt_2026') {
  return 'dev_' + crypto.createHash('sha256').update(salt + Date.now() + Math.random()).digest('hex').slice(0, 16);
}

module.exports = {
  validateDeviceLicense,
  generateAppInstanceId,
  AUTHORIZED_DEVICES,
  activeDeviceRegistry
};
