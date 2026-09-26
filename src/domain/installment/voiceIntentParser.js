/**
 * GARUDA VOICE INTENT PARSER (Hindi & Hinglish)
 * 
 * Supports natural collection phrases:
 * - "Ramesh ne 500 diye"
 * - "Ramesh ke 500 jama karo"
 * - "Ramesh se paanch sau mile"
 * - "Suresh ka 1000 cash mila"
 * - "Mohan ka hisaab dikhao"
 * 
 * Extracts:
 * - intent: 'PAYMENT' | 'VIEW_CUSTOMER' | 'UNKNOWN'
 * - customerName
 * - amount
 * - paymentMode: 'cash' | 'upi' | 'bank'
 * - confidence: 0.0 to 1.0
 */

const HINDI_NUMBERS = {
  'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'chaar': 4, 'paanch': 5, 'panch': 5,
  'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
  'sau': 100, 'hazar': 1000, 'hazaar': 1000, 'lakh': 100000
};

function parseHindiNumberWords(text) {
  const words = text.toLowerCase().split(/\s+/);
  let total = 0;
  let currentGroup = 0;
  let found = false;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (HINDI_NUMBERS[w] !== undefined) {
      found = true;
      const val = HINDI_NUMBERS[w];
      if (val === 100) {
        currentGroup = (currentGroup === 0 ? 1 : currentGroup) * 100;
        total += currentGroup;
        currentGroup = 0;
      } else if (val === 1000 || val === 100000) {
        currentGroup = (currentGroup === 0 ? 1 : currentGroup) * val;
        total += currentGroup;
        currentGroup = 0;
      } else {
        currentGroup += val;
      }
    }
  }

  total += currentGroup;
  return found ? total : null;
}

function extractAmount(text) {
  // 1. Look for numeric digits like 500, 1000, ₹500, Rs 500
  const digitMatch = text.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i);
  if (digitMatch && digitMatch[1]) {
    const cleaned = digitMatch[1].replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) return num;
  }

  // 2. Look for spoken Hindi numbers (e.g. "paanch sau")
  const hindiNum = parseHindiNumberWords(text);
  if (hindiNum && hindiNum > 0) return hindiNum;

  return null;
}

function parseVoiceCommand(spokenText, existingCustomerNames = []) {
  if (!spokenText || typeof spokenText !== 'string') {
    return { intent: 'UNKNOWN', confidence: 0, rawText: '' };
  }

  const raw = spokenText.trim();
  const lower = raw.toLowerCase();

  // Mode detection
  let mode = 'cash';
  if (/upi|phonepe|gpay|google pay|paytm/i.test(lower)) {
    mode = 'upi';
  } else if (/bank|transfer|cheque|neft|rtgs/i.test(lower)) {
    mode = 'bank';
  }

  // Intent: View Customer Hisaab
  if (/hisaab|hisab|history|balance|dekho|dikhao|profile/i.test(lower) && !/jama|diye|mile|payment/i.test(lower)) {
    // Extract customer name
    let matchedCustomer = '';
    for (const name of existingCustomerNames) {
      if (lower.includes(name.toLowerCase())) {
        matchedCustomer = name;
        break;
      }
    }
    if (!matchedCustomer) {
      const match = raw.match(/^([a-zA-Z\u0900-\u097F]+)\s+(?:ka|ki|ke)\s+hisaab/i);
      if (match) matchedCustomer = match[1];
    }
    return {
      intent: 'VIEW_CUSTOMER',
      customerName: matchedCustomer || 'Customer',
      confidence: matchedCustomer ? 0.9 : 0.6,
      rawText: raw
    };
  }

  // Intent: Record Payment
  // Examples:
  // "Ramesh ne 500 diye"
  // "Ramesh ke 500 jama karo"
  // "Ramesh se 500 mile"
  // "500 ramesh se mile"
  const isPaymentPhrase = /jama|diye|diya|mile|mila|pay|payment|bheje|bheja/i.test(lower);
  const amount = extractAmount(lower);

  if (isPaymentPhrase || amount !== null) {
    // Extract name
    let customerName = '';

    // Check against known customers first for highest precision
    for (const name of existingCustomerNames) {
      if (lower.includes(name.toLowerCase())) {
        customerName = name;
        break;
      }
    }

    if (!customerName) {
      // Common pattern: "<Name> ne / ke / se <amount> diye / jama karo"
      const nameMatch = raw.match(/^([a-zA-Z\u0900-\u097F]+)\s+(?:ne|ke|se|ka)\s+/i);
      if (nameMatch) {
        customerName = nameMatch[1];
      } else {
        // Pattern: "<amount> <Name> se / ne"
        const reverseMatch = raw.match(/[0-9]+\s+(?:rupaye|rs|₹)?\s*([a-zA-Z\u0900-\u097F]+)\s+(?:se|ne)/i);
        if (reverseMatch) {
          customerName = reverseMatch[1];
        }
      }
    }

    // Calculate confidence
    let confidence = 0.5;
    if (customerName && amount) {
      confidence = 0.95;
    } else if (amount) {
      confidence = 0.7; // Has amount but name ambiguous
    } else if (customerName) {
      confidence = 0.6; // Has name but amount missing
    }

    return {
      intent: 'PAYMENT',
      customerName: customerName || null,
      amount: amount || null,
      paymentMode: mode,
      confidence,
      requiresConfirmation: true, // Always show confirmation modal
      rawText: raw
    };
  }

  return {
    intent: 'UNKNOWN',
    confidence: 0.2,
    rawText: raw,
    message: 'Command samajh nahi aaya. Kripya dobara bole.'
  };
}

module.exports = {
  parseVoiceCommand,
  extractAmount,
  parseHindiNumberWords
};
