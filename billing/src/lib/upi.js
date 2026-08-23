import QRCode from 'qrcode'

export function upiUrl(company, amount, ref) {
  const pa = String(company?.upiId || '').trim()
  if (!pa) return null
  const params = new URLSearchParams({
    pa,
    pn: String(company?.bankHolder || company?.name || 'Business').slice(0, 24),
    am: String(Number(amount || 0).toFixed(2)),
    cu: 'INR'
  })
  if (ref) params.set('tn', String(ref).slice(0, 60))
  return 'upi://pay?' + params.toString()
}

export async function upiQrDataUrl(company, amount, ref, size = 360) {
  const url = upiUrl(company, amount, ref)
  if (!url) return null
  return QRCode.toDataURL(url, { margin: 1, width: size, color: { dark: '#0b0b0b', light: '#ffffff' } })
}

export function bankLines(company) {
  const out = []
  if (company?.bankHolder) out.push([company.bankHolder, 'A/c Holder'])
  if (company?.bankName) out.push([company.bankName, 'Bank'])
  if (company?.bankAccount) out.push([company.bankAccount, 'A/c No'])
  if (company?.bankIfsc) out.push([company.bankIfsc, 'IFSC'])
  return out
}