/**
 * GARUDA SUBSCRIPTION ENGINE
 * 
 * Commercial Policy:
 * - Annual cloud / data / maintenance fee: ₹6,000/year
 * - Capacity: ~3,000 customer records
 * - Expiration reminders: 30 days, 7 days, 1 day before expiry
 * - Non-Destructive Policy:
 *   NEVER delete customer data on expiry.
 *   Local history and existing ledger ALWAYS remain readable.
 *   Cloud sync and new entry creation are paused until renewal.
 */

const ANNUAL_FEE_INR = 6000;
const MAX_CUSTOMER_CAPACITY = 3000;

function evaluateSubscriptionStatus({
  subscriptionStartDate,
  subscriptionEndDate,
  currentDate = new Date()
}) {
  const start = new Date(subscriptionStartDate);
  const end = new Date(subscriptionEndDate);
  const now = new Date(currentDate);

  const diffMs = end.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Policy: Active, In-Warning, or Expired
  if (daysRemaining > 30) {
    return {
      status: 'ACTIVE',
      annualFee: ANNUAL_FEE_INR,
      maxCapacity: MAX_CUSTOMER_CAPACITY,
      daysRemaining,
      showWarningBanner: false,
      warningMessage: null,
      canReadHistory: true,
      canCreateEntries: true,
      canSyncCloud: true
    };
  }

  if (daysRemaining > 0 && daysRemaining <= 30) {
    let warningUrgency = 'LOW';
    let warningHindi = `आपका cloud backup subscription ${daysRemaining} दिनों में समाप्त होगा। निर्बाध सेवा के लिए समय पर renew करें।`;

    if (daysRemaining <= 1) {
      warningUrgency = 'CRITICAL';
      warningHindi = `⚠️ कल आपका subscription समाप्त हो रहा है! Renewal राशि: ₹${ANNUAL_FEE_INR}/वर्ष।`;
    } else if (daysRemaining <= 7) {
      warningUrgency = 'HIGH';
      warningHindi = `⚠️ केवल ${daysRemaining} दिन शेष हैं! अपने cloud sync और 3,000 ग्राहकों के डेटा की सुरक्षा हेतु renew करें।`;
    }

    return {
      status: 'ACTIVE_WARNING',
      annualFee: ANNUAL_FEE_INR,
      maxCapacity: MAX_CUSTOMER_CAPACITY,
      daysRemaining,
      showWarningBanner: true,
      warningUrgency,
      warningMessage: warningHindi,
      canReadHistory: true,
      canCreateEntries: true,
      canSyncCloud: true
    };
  }

  // EXPIRED STATE: Non-destructive
  return {
    status: 'EXPIRED',
    annualFee: ANNUAL_FEE_INR,
    maxCapacity: MAX_CUSTOMER_CAPACITY,
    daysRemaining: 0,
    showWarningBanner: true,
    warningUrgency: 'LOCKED',
    warningMessage: 'आपका subscription समाप्त हो गया है। Renewal के बाद cloud sync और नई entries फिर से चालू हो जाएंगी। (आपका पुराना डेटा पूरी तरह सुरक्षित है)',
    canReadHistory: true,       // Non-destructive: History is ALWAYS readable
    canCreateEntries: false,    // Paused until renewal
    canSyncCloud: false         // Paused until renewal
  };
}

module.exports = {
  ANNUAL_FEE_INR,
  MAX_CUSTOMER_CAPACITY,
  evaluateSubscriptionStatus
};
