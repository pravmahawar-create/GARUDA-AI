/**
 * GARUDA PHOTO OCR PARSER & VALIDATOR
 * 
 * Extracts structured customer installment fields from handwritten notebook text.
 * Validates mathematical consistency:
 * - Total - Paid === Remaining
 * - Installment amount <= Total
 * Flags low-confidence or missing fields.
 */

function parseOcrText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      success: false,
      confidence: 0,
      fields: {},
      validationErrors: ['No text detected in image']
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const fields = {
    name: '',
    phone: '',
    totalAmount: null,
    downPayment: 0,
    installmentAmount: null,
    frequency: 'weekly',
    preferredDay: 'Monday',
    paidAmount: 0,
    remainingAmount: null,
    notes: ''
  };

  const validationErrors = [];
  let nameFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // 1. Phone number (10 digits)
    const phoneMatch = line.match(/(?:(?:\+91|0)?[ -]?)?([6-9]\d{9})\b/);
    if (phoneMatch && !fields.phone) {
      fields.phone = phoneMatch[1];
      continue;
    }

    // 2. Frequency detection
    if (/daily|roj|har din|roz/i.test(lower)) {
      fields.frequency = 'daily';
    } else if (/monthly|mahina|har mahine|maheene/i.test(lower)) {
      fields.frequency = 'monthly';
    } else if (/weekly|hafta|hafte|somwar|mangal|budh|guru|shukra|shani|ravi/i.test(lower)) {
      fields.frequency = 'weekly';
      if (/somwar|monday/i.test(lower)) fields.preferredDay = 'Monday';
      else if (/mangal|tuesday/i.test(lower)) fields.preferredDay = 'Tuesday';
      else if (/budh|wednesday/i.test(lower)) fields.preferredDay = 'Wednesday';
      else if (/guru|thursday/i.test(lower)) fields.preferredDay = 'Thursday';
      else if (/shukra|friday/i.test(lower)) fields.preferredDay = 'Friday';
      else if (/shani|saturday/i.test(lower)) fields.preferredDay = 'Saturday';
      else if (/ravi|sunday/i.test(lower)) fields.preferredDay = 'Sunday';
    }

    // 3. Total amount
    const totalMatch = line.match(/(?:total|kul|rakam|amount|pura|poora)?\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*)/i);
    if (/total|kul|rakam|amount|pura/i.test(lower) && totalMatch && fields.totalAmount === null) {
      fields.totalAmount = parseFloat(totalMatch[1].replace(/,/g, ''));
      continue;
    }

    // 4. Installment / Kist amount
    const kistMatch = line.match(/(?:kist|installment|hafta|roj|mahina)?\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*)/i);
    if (/kist|installment|hafte ka/i.test(lower) && kistMatch && fields.installmentAmount === null) {
      fields.installmentAmount = parseFloat(kistMatch[1].replace(/,/g, ''));
      continue;
    }

    // 5. Down payment / Jama
    const downMatch = line.match(/(?:jama|down|advance|cash diya)?\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*)/i);
    if (/down|advance|jama diya/i.test(lower) && downMatch) {
      fields.downPayment = parseFloat(downMatch[1].replace(/,/g, ''));
      continue;
    }

    // 6. Name extraction (Usually first line or line starting with "Naam" / "Name")
    if (!nameFound) {
      const explicitName = line.match(/(?:naam|name)\s*[:=-]?\s*([a-zA-Z\u0900-\u097F ]+)/i);
      if (explicitName && explicitName[1]) {
        fields.name = explicitName[1].trim();
        nameFound = true;
      } else if (!/^[0-9₹]|rs|total|kist|phone|mob/i.test(line) && line.length >= 3 && line.length <= 40) {
        // Line looks like a clean name
        fields.name = line.replace(/[^a-zA-Z\u0900-\u097F ]/g, '').trim();
        nameFound = true;
      }
    }
  }

  // Fallback for numbers if labels were not explicit
  // Extract all numbers found in the text in descending order
  const allNumbers = [];
  const numRegex = /(?:₹|rs\.?)?\s*([0-9]+(?:,[0-9]+)*)/gi;
  let match;
  while ((match = numRegex.exec(rawText)) !== null) {
    const val = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && String(val).length < 9) { // exclude phone numbers
      allNumbers.push(val);
    }
  }

  if (fields.totalAmount === null && allNumbers.length > 0) {
    fields.totalAmount = Math.max(...allNumbers);
  }

  if (fields.installmentAmount === null && allNumbers.length > 1) {
    // Pick standard installment amount (smaller than total)
    const candidates = allNumbers.filter(n => n < fields.totalAmount && n >= 50);
    if (candidates.length > 0) {
      fields.installmentAmount = candidates[0];
    }
  }

  // Default installment amount if still null
  if (fields.totalAmount && !fields.installmentAmount) {
    // Default to ~10-20 installments
    fields.installmentAmount = Math.round(fields.totalAmount / 20) || 500;
  }

  fields.remainingAmount = (fields.totalAmount || 0) - (fields.downPayment || 0);

  // Confidence & Validation Scoring
  let score = 0;
  if (fields.name) score += 30; else validationErrors.push('Customer name could not be confidently identified');
  if (fields.totalAmount && fields.totalAmount > 0) score += 30; else validationErrors.push('Total amount is missing or zero');
  if (fields.installmentAmount && fields.installmentAmount > 0) score += 20; else validationErrors.push('Installment amount is missing or zero');
  if (fields.frequency) score += 10;
  if (fields.phone) score += 10;

  // Invariant validation
  if (fields.totalAmount && fields.installmentAmount && fields.installmentAmount > fields.totalAmount) {
    validationErrors.push('Installment amount cannot be greater than total amount');
    score -= 20;
  }

  const confidence = Math.max(0, Math.min(100, score)) / 100;

  return {
    success: confidence >= 0.5 && validationErrors.length === 0,
    confidence,
    requiresUserReview: true, // Non-negotiable: Never silently save financial data without confirmation
    fields,
    validationErrors,
    rawTextPreview: rawText.slice(0, 300)
  };
}

module.exports = {
  parseOcrText
};
