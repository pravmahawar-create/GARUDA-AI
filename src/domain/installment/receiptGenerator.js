/**
 * GARUDA RECEIPT & STATEMENT GENERATOR
 * 
 * Modular generation for:
 * 1. Single Payment Receipt (Thermal 58mm/80mm & A4 printable)
 * 2. Complete Customer Hisaab Statement
 * 3. WhatsApp shareable text payload
 */

function formatInr(amount) {
  return '₹' + Math.round(Number(amount) || 0).toLocaleString('en-IN');
}

/**
 * Generates structured single payment receipt.
 */
function generatePaymentReceipt({
  businessName = 'श्री गणेश इलेक्ट्रॉनिक्स एवं फर्नीचर',
  businessPhone = '9826012345',
  businessAddress = 'मेन मार्केट, गांधी चौक',
  receiptNumber,
  customerName,
  customerPhone,
  paymentAmount,
  paymentMode = 'नकद (Cash)',
  paymentTimestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  totalPlanAmount,
  totalPaidSoFar,
  remainingBalance,
  nextDueDate,
  nextDueAmount,
  note = '',
  lang = 'hi'
}) {
  let title = 'Payment Receipt';
  let custLabel = 'Customer:';
  let amtReceivedLabel = 'Amount Received:';
  let remainingLabel = 'Remaining:';
  let phoneLabel = 'Mob:';
  let dateLabel = 'Date:';
  let receiptNoLabel = 'Receipt No:';
  let totalLabel = 'Total:';
  let totalPaidLabel = 'Total Paid:';
  let nextInstallmentLabel = 'Next Installment:';
  let nextDueLabel = 'Next Due Date:';
  let thankYou = 'Thank You!';

  if (lang === 'hinglish') {
    title = 'Payment Receipt';
    custLabel = 'Customer:';
    amtReceivedLabel = 'Paisa Mila:';
    remainingLabel = 'Baaki:';
    phoneLabel = 'Mob:';
    dateLabel = 'Date:';
    receiptNoLabel = 'Receipt No:';
    totalLabel = 'Total:';
    totalPaidLabel = 'Kul Jama:';
    nextInstallmentLabel = 'Agli Kist:';
    nextDueLabel = 'Agli Due Date:';
    thankYou = 'Dhanyawaad!';
  } else if (lang === 'hi') {
    title = 'भुगतान रसीद';
    custLabel = 'ग्राहक:';
    amtReceivedLabel = 'जमा राशि:';
    remainingLabel = 'बाकी:';
    phoneLabel = 'फोन:';
    dateLabel = 'दिनांक:';
    receiptNoLabel = 'रसीद सं.:';
    totalLabel = 'कुल:';
    totalPaidLabel = 'कुल जमा:';
    nextInstallmentLabel = 'अगली किस्त:';
    nextDueLabel = 'अगली देय तिथि:';
    thankYou = 'धन्यवाद!';
  }

  const plainText = 
`================================
${businessName}
${businessAddress} | ${phoneLabel} ${businessPhone}
================================
${title}
${receiptNoLabel} ${receiptNumber || 'REC-' + Date.now()}
${dateLabel} ${paymentTimestamp}
--------------------------------
${custLabel}
${customerName}
${phoneLabel} ${customerPhone || '-'}
--------------------------------
${amtReceivedLabel} ${formatInr(paymentAmount)}
${remainingLabel} ${formatInr(remainingBalance)}
--------------------------------
${totalLabel} ${formatInr(totalPlanAmount)}
${totalPaidLabel} ${formatInr(totalPaidSoFar)}
${nextInstallmentLabel} ${formatInr(nextDueAmount)}
${nextDueLabel} ${nextDueDate || (lang === 'en' ? 'Completed' : lang === 'hinglish' ? 'Completed' : 'पूर्ण')}
================================
${thankYou} (GARUDA Kist • garudaos.in)
================================`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${receiptNumber}</title>
  <style>
    @media print {
      @page { margin: 5mm; size: auto; }
      body { margin: 0; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      max-width: 380px;
      margin: 10px auto;
      padding: 16px;
      border: 1px dashed #ccc;
      color: #111;
      background: #fff;
    }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .biz-name { font-size: 18px; font-weight: bold; margin: 0; }
    .biz-sub { font-size: 11px; color: #555; margin-top: 4px; }
    .title { text-align: center; font-weight: bold; font-size: 14px; margin: 8px 0; background: #eee; padding: 4px; }
    .row { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
    .row.highlight { font-weight: bold; font-size: 15px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 0; margin: 8px 0; }
    .divider { border-bottom: 1px dashed #aaa; margin: 8px 0; }
    .footer { text-align: center; font-size: 11px; color: #666; margin-top: 12px; border-top: 1px solid #ddd; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="biz-name">${businessName}</div>
    <div class="biz-sub">${businessAddress} • ${phoneLabel} ${businessPhone}</div>
  </div>
  <div class="title">${title} (PAYMENT RECEIPT)</div>
  <div class="row"><span>${receiptNoLabel}</span><span>${receiptNumber || 'REC-' + Date.now()}</span></div>
  <div class="row"><span>${dateLabel}</span><span>${paymentTimestamp}</span></div>
  <div class="divider"></div>
  <div class="row"><span>${custLabel}</span><b>${customerName}</b></div>
  <div class="row"><span>${phoneLabel}</span><span>${customerPhone || '-'}</span></div>
  <div class="row highlight"><span>${amtReceivedLabel}</span><span>${formatInr(paymentAmount)}</span></div>
  <div class="row highlight" style="color: #c00;"><span>${remainingLabel}</span><span>${formatInr(remainingBalance)}</span></div>
  <div class="divider"></div>
  <div class="row"><span>${totalLabel}</span><span>${formatInr(totalPlanAmount)}</span></div>
  <div class="row"><span>${totalPaidLabel}</span><span>${formatInr(totalPaidSoFar)}</span></div>
  <div class="divider"></div>
  <div class="row"><span>${nextDueLabel}</span><b>${nextDueDate || (lang === 'en' ? 'Completed' : lang === 'hinglish' ? 'Completed' : 'पूर्ण')}</b></div>
  <div class="row"><span>${nextInstallmentLabel}</span><span>${formatInr(nextDueAmount)}</span></div>
  <div class="footer">
    ${thankYou}<br>
    <i>GARUDA Kist System • garudaos.in</i>
  </div>
</body>
</html>`;

  let whatsappMessage = '';
  if (lang === 'en') {
    whatsappMessage = 
`*${businessName} — Payment Receipt*
Customer: ${customerName}
Amount Received: ${formatInr(paymentAmount)}
Remaining: ${formatInr(remainingBalance)}
Next Due Date: ${nextDueDate || 'Completed'} (Installment: ${formatInr(nextDueAmount)})

Receipt No: ${receiptNumber || 'REC'}
Thank you!`;
  } else if (lang === 'hinglish') {
    whatsappMessage = 
`*${businessName} — Payment Receipt*
Customer: ${customerName}
Paisa Mila: ${formatInr(paymentAmount)}
Baaki: ${formatInr(remainingBalance)}
Agli Due Date: ${nextDueDate || 'Completed'} (Kist: ${formatInr(nextDueAmount)})

Receipt No: ${receiptNumber || 'REC'}
Dhanyawaad!`;
  } else {
    whatsappMessage = 
`*${businessName} — किस्त रसीद*
ग्राहक: ${customerName}
जमा राशि: ${formatInr(paymentAmount)}
बाकी: ${formatInr(remainingBalance)}
अगली देय तिथि: ${nextDueDate || 'पूर्ण'} (किस्त: ${formatInr(nextDueAmount)})

रसीद संख्या: ${receiptNumber || 'REC'}
धन्यवाद!`;
  }

  return {
    plainText,
    html,
    whatsappMessage
  };
}

/**
 * Generates full customer statement (Hisaab).
 */
function generateCustomerStatement({
  businessName = 'श्री गणेश इलेक्ट्रॉनिक्स',
  businessPhone = '9826012345',
  customer,
  plan,
  payments = []
}) {
  const total = Number(plan.totalAmount) || 0;
  const down = Number(plan.downPayment) || 0;
  const totalPaid = down + payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remaining = Math.max(0, total - totalPaid);

  let statementRows = '';
  if (down > 0) {
    statementRows += `<div class="row"><span>${plan.startDate}</span><span>डाउन पेमेंट</span><span>-</span><span>${formatInr(down)}</span><span>${formatInr(total - down)}</span></div>`;
  }

  let runningBalance = total - down;
  payments.forEach((p, idx) => {
    runningBalance = Math.max(0, runningBalance - Number(p.amount));
    statementRows += `<div class="row"><span>${p.date}</span><span>किस्त #${idx + 1} (${p.mode || 'Cash'})</span><span>${p.receiptNumber || '-'}</span><span>${formatInr(p.amount)}</span><span>${formatInr(runningBalance)}</span></div>`;
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Statement - ${customer.name}</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; color: #111; }
    .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 10px; }
    .row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #eee; }
    .row.head { font-weight: bold; background: #f5f5f5; border-bottom: 2px solid #333; }
    .summary-box { background: #fafafa; border: 1px solid #ddd; padding: 12px; margin: 16px 0; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>${businessName}</h2>
    <p>ग्राहक का संपूर्ण हिसाब (Ledger Statement) • फोन: ${businessPhone}</p>
  </div>
  <div class="summary-box">
    <b>ग्राहक: ${customer.name}</b> (फोन: ${customer.phone || '-'})<br>
    सामान विवरण: ${plan.itemDescription || 'सामान'}<br>
    कुल मूल्य: <b>${formatInr(total)}</b> | कुल जमा: <b>${formatInr(totalPaid)}</b> | बाकी: <b style="color:#d00;">${formatInr(remaining)}</b>
  </div>
  <div class="row head">
    <span>दिनांक</span><span>विवरण</span><span>रसीद</span><span>जमा</span><span>शेष</span>
  </div>
  ${statementRows}
</body>
</html>`;

  return { html };
}

module.exports = {
  formatInr,
  generatePaymentReceipt,
  generateCustomerStatement
};
