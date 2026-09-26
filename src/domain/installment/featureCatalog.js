/**
 * GARUDA CAPABILITY CATALOG (Feature Drop Box)
 * 
 * Configurable catalog of modular expansion add-ons:
 * - Billing Module (Invoices, GST, Thermal Print)
 * - Stock / Inventory Management
 * - Advanced Business Intelligence & P&L Reports
 * - Autonomous WhatsApp Reminders & Follow-up Bot
 * - Local Delivery & Dispatch Tracking
 * 
 * Note: Billing is an ADD-ON, NOT included in the ₹12,000 core installment scope.
 */

const FEATURE_CATALOG = [
  {
    featureId: 'GARUDA_BILLING',
    name: {
      english: 'GST & Invoice Billing',
      hinglish: 'GST Aur Pakka Bill',
      hindi: 'GST एवं पक्का बिल (Billing Module)'
    },
    description: {
      english: 'Store GST invoice, thermal printer receipt, invoice PDF and sales ledger.',
      hinglish: 'Dukaan ka GST bill, thermal printer receipt, invoice PDF aur sale register.',
      hindi: 'दुकान का GST बिल, थर्मल प्रिंटर रसीद, इनवॉइस PDF और सेल रजिस्टर।'
    },
    nameEnglish: 'GST & Invoice Billing',
    nameHinglish: 'GST Aur Pakka Bill',
    nameHindi: 'GST एवं पक्का बिल (Billing Module)',
    tagline: 'Bill bhi banana hai?',
    descriptionEnglish: 'Store GST invoice, thermal printer receipt, invoice PDF and sales ledger.',
    descriptionHinglish: 'Dukaan ka GST bill, thermal printer receipt, invoice PDF aur sale register.',
    descriptionHindi: 'दुकान का GST बिल, थर्मल प्रिंटर रसीद, इनवॉइस PDF और सेल रजिस्टर।',
    price: 4999,
    currency: 'INR',
    billingCycle: 'one-time',
    status: 'AVAILABLE_ADDON',
    inCoreScope: false, // Explicitly separate from ₹12k core scope
    inquiryPrompt: 'Namaste! I would like to add the Billing & Invoice Module to GARUDA Kist.'
  },
  {
    featureId: 'GARUDA_STOCK',
    name: {
      english: 'Stock & Inventory Management',
      hinglish: 'Stock Aur Inventory',
      hindi: 'स्टॉक व इन्वेंट्री (Stock Management)'
    },
    description: {
      english: 'Low stock alerts, warehouse counting, and inventory tracking.',
      hinglish: 'Dukaan me kaun sa saaman khatam ho raha hai, low-stock alert aur godown ginti.',
      hindi: 'दुकान में कौन सा सामान खत्म हो रहा है, लो-स्टॉक अलर्ट और गोदाम की गिनती।'
    },
    nameEnglish: 'Stock & Inventory Management',
    nameHinglish: 'Stock Aur Inventory',
    nameHindi: 'स्टॉक व इन्वेंट्री (Stock Management)',
    tagline: 'Stock bhi dekhna hai?',
    descriptionEnglish: 'Low stock alerts, warehouse counting, and inventory tracking.',
    descriptionHinglish: 'Dukaan me kaun sa saaman khatam ho raha hai, low-stock alert aur godown ginti.',
    descriptionHindi: 'दुकान में कौन सा सामान खत्म हो रहा है, लो-स्टॉक अलर्ट और गोदाम की गिनती।',
    price: 3499,
    currency: 'INR',
    billingCycle: 'one-time',
    status: 'AVAILABLE_ADDON',
    inCoreScope: false,
    inquiryPrompt: 'Namaste! I would like to know more about the GARUDA Stock Management Module.'
  },
  {
    featureId: 'GARUDA_REPORTS',
    name: {
      english: 'Advanced P&L Analytics',
      hinglish: 'Munafa-Ghata Reports',
      hindi: 'मुफ़ाफा व घाटा रिपोर्ट (Advanced Reports)'
    },
    description: {
      english: 'Monthly profit/loss, top paying customers, and annual sales charts.',
      hinglish: 'Mahine ka munafa-nuksaan, best customers aur saal bhar ki kamai ka graph.',
      hindi: 'मासिक नफा-नुकसान, सबसे अच्छे ग्राहक, और साल भर की कमाई का ग्राफ।'
    },
    nameEnglish: 'Advanced P&L Analytics',
    nameHinglish: 'Munafa-Ghata Reports',
    nameHindi: 'मुफ़ाफा व घाटा रिपोर्ट (Advanced Reports)',
    tagline: 'Business reports chahiye?',
    descriptionEnglish: 'Monthly profit/loss, top paying customers, and annual sales charts.',
    descriptionHinglish: 'Mahine ka munafa-nuksaan, best customers aur saal bhar ki kamai ka graph.',
    descriptionHindi: 'मासिक नफा-नुकसान, सबसे अच्छे ग्राहक, और साल भर की कमाई का ग्राफ।',
    price: 1999,
    currency: 'INR',
    billingCycle: 'annual',
    status: 'AVAILABLE_ADDON',
    inCoreScope: false,
    inquiryPrompt: 'Namaste! I would like to add the Advanced Reports Module to GARUDA Kist.'
  },
  {
    featureId: 'GARUDA_WHATSAPP_BOT',
    name: {
      english: 'Automated WhatsApp Reminders',
      hinglish: 'Automatic WhatsApp Tagada',
      hindi: 'ऑटोमैटिक वॉट्सऐप तगादा (WhatsApp Automation)'
    },
    description: {
      english: 'Send automated reminder messages to customers 1 day before due date.',
      hinglish: 'Customers ko due date se 1 din pehle automatic reminder bhejein.',
      hindi: 'ग्राहकों को ड्यू डेट से 1 दिन पहले खुद-ब-खुद वॉट्सऐप तगादा संदेश भेजना।'
    },
    nameEnglish: 'Automated WhatsApp Reminders',
    nameHinglish: 'Automatic WhatsApp Tagada',
    nameHindi: 'ऑटोमैटिक वॉट्सऐप तगादा (WhatsApp Automation)',
    tagline: 'Automatic reminders chahiye?',
    descriptionEnglish: 'Send automated reminder messages to customers 1 day before due date.',
    descriptionHinglish: 'Customers ko due date se 1 din pehle automatic reminder bhejein.',
    descriptionHindi: 'ग्राहकों को ड्यू डेट से 1 दिन पहले खुद-ब-खुद वॉट्सऐप तगादा संदेश भेजना।',
    price: 2499,
    currency: 'INR',
    billingCycle: 'annual',
    status: 'AVAILABLE_ADDON',
    inCoreScope: false,
    inquiryPrompt: 'Namaste! I would like to activate Automatic WhatsApp Payment Reminders.'
  },
  {
    featureId: 'GARUDA_DELIVERY',
    name: {
      english: 'Local Delivery & Dispatch Tracking',
      hinglish: 'Delivery Aur Dispatch Tracking',
      hindi: 'डिलीवरी व डिस्पैच ट्रैकिंग (Delivery Tracking)'
    },
    description: {
      english: 'Dispatch status, delivery confirmation, and driver live tracking.',
      hinglish: 'Saaman kab nikla, customer tak kab pahuncha aur driver ka live status.',
      hindi: 'सामान कब निकला, ग्राहक तक कब पहुंचा और ड्राइवर का लाइव स्टेटस।'
    },
    nameEnglish: 'Local Delivery & Dispatch Tracking',
    nameHinglish: 'Delivery Aur Dispatch Tracking',
    nameHindi: 'डिलीवरी व डिस्पैच ट्रैकिंग (Delivery Tracking)',
    tagline: 'Delivery track karni hai?',
    descriptionEnglish: 'Dispatch status, delivery confirmation, and driver live tracking.',
    descriptionHinglish: 'Saaman kab nikla, customer tak kab pahuncha aur driver ka live status.',
    descriptionHindi: 'सामान कब निकला, ग्राहक तक कब पहुंचा और ड्राइवर का लाइव स्टेटस।',
    price: 2999,
    currency: 'INR',
    billingCycle: 'one-time',
    status: 'AVAILABLE_ADDON',
    inCoreScope: false,
    inquiryPrompt: 'Namaste! I would like to add Delivery & Driver Tracking to GARUDA Kist.'
  }
];

function getCatalogFeatures() {
  return FEATURE_CATALOG;
}

function generateFeatureInquiryResponse(featureId, lang = 'hi') {
  const feat = FEATURE_CATALOG.find(f => f.featureId === featureId);
  if (!feat) {
    return {
      success: false,
      message: 'Feature not found in catalog.'
    };
  }

  let featName = feat.nameHindi;
  let responseText = '';
  if (lang === 'en') {
    featName = feat.nameEnglish;
    responseText = `The ${featName} module can be activated for your store. Additional fee: ₹${feat.price.toLocaleString('en-IN')}. Our team will contact you within 24 hours.`;
  } else if (lang === 'hinglish') {
    featName = feat.nameHinglish;
    responseText = `Bilkul! ${featName} module turant chalu ho sakta hai. Iska fee: ₹${feat.price.toLocaleString('en-IN')}. Hamari team 24 ghante me aapse contact karegi.`;
  } else {
    featName = feat.nameHindi;
    responseText = `बिल्कुल! ${feat.nameHindi} मॉड्यूल तुरंत सक्रिय किया जा सकता है। इसका अतिरिक्त शुल्क ₹${feat.price.toLocaleString('en-IN')} है। हमारी टीम 24 घंटे में इसे एक्टिवेट कर देगी।`;
  }

  return {
    success: true,
    featureId: feat.featureId,
    name: featName,
    price: feat.price,
    currency: feat.currency,
    responseText,
    portalLink: `https://www.garudaos.in/chat?ref=addon_${feat.featureId}`
  };
}

module.exports = {
  FEATURE_CATALOG,
  getCatalogFeatures,
  generateFeatureInquiryResponse
};
