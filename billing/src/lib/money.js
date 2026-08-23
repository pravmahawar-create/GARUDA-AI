export function inr(n) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2
  }).format(Number(n || 0))
}

export function inrFull(n) {
  return '₹' + inr(n)
}

export function calcBill(items, opts = {}) {
  const { gstRate = 18, discount = 0, transport = {}, billType = 'gst', mode = 'intra' } = opts
  const isKaccha = billType === 'kaccha'
  const rate = isKaccha ? 0 : Number(gstRate) || 0
  const lines = items
    .filter((i) => i && Number(i.qty) > 0)
    .map((i) => {
      const qty = Number(i.qty) || 0
      const r = Number(i.rate) || 0
      return { ...i, qty, rate: r, amount: qty * r }
    })
  const subtotal = lines.reduce((s, l) => s + l.amount, 0)
  const taxable = Math.max(0, subtotal - (Number(discount) || 0))
  const gst = Math.round(taxable * rate) / 100
  const half = gst / 2
  const inter = mode === 'inter'
  const freight = Number(transport.freight) || 0
  const loading = Number(transport.loading) || 0
  const unloading = Number(transport.unloading) || 0
  const grandTotal = Math.round((taxable + gst + freight + loading + unloading) * 100) / 100
  return {
    lines,
    subtotal: Math.round(subtotal * 100) / 100,
    taxable: Math.round(taxable * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    gstRate: rate,
    billType,
    mode: isKaccha ? 'intra' : inter ? 'inter' : 'intra',
    cgst: isKaccha || inter ? 0 : Math.round(half * 100) / 100,
    sgst: isKaccha || inter ? 0 : Math.round(half * 100) / 100,
    igst: isKaccha ? 0 : inter ? Math.round(gst * 100) / 100 : 0,
    discount: Number(discount) || 0,
    freight,
    loading,
    unloading,
    grandTotal
  }
}

export function amountInWords(amount) {
  const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
  const n = Math.floor(Number(amount) || 0)
  if (n === 0) return 'Zero Rupees Only'
  let words = ''
  const two = (x) => {
    if (x < 10) return units[x]
    if (x < 20) return teens[x - 10]
    return tens[Math.floor(x / 10)] + (x % 10 ? ' ' + units[x % 10] : '')
  }
  const lakh = Math.floor(n / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const hundred = Math.floor((n % 1000) / 100)
  const rest = n % 100
  if (lakh) words += two(lakh) + ' lakh '
  if (thousand) words += two(thousand) + ' thousand '
  if (hundred) words += units[hundred] + ' hundred '
  if (rest) words += two(rest)
  const paise = Math.round((Number(amount) - n) * 100)
  let out = words.trim() + ' Rupees'
  if (paise) out += ' and ' + two(paise) + ' Paise'
  return out + ' Only'
}