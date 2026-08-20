const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function gstinCheckChar(gstin14) {
  const g = String(gstin14 || '').trim().toUpperCase().slice(0, 14)
  if (g.length !== 14) return null
  let sum = 0
  for (let i = 0; i < 14; i++) {
    const idx = ALPHABET.indexOf(g[i])
    if (idx === -1) return null
    const product = idx * ((i % 2) + 1)
    sum += Math.floor(product / 36) + (product % 36)
  }
  const check = 36 - (sum % 36)
  if (check < 0 || check > 35) return null
  return ALPHABET.charAt(check)
}

export function validateGstin(gstin) {
  const g = String(gstin || '').trim().toUpperCase()
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g)) return false
  const expected = gstinCheckChar(g.slice(0, 14))
  return expected !== null && g.charAt(14) === expected
}

export function gstStateCode(gstin) {
  const g = String(gstin || '').trim()
  const code = parseInt(g.slice(0, 2), 10)
  const states = {
    1: 'Jammu & Kashmir', 2: 'Himachal Pradesh', 3: 'Punjab', 4: 'Chandigarh', 5: 'Uttarakhand',
    6: 'Haryana', 7: 'Delhi', 8: 'Rajasthan', 9: 'Uttar Pradesh', 10: 'Bihar', 11: 'Sikkim',
    12: 'Arunachal Pradesh', 13: 'Nagaland', 14: 'Manipur', 15: 'Mizoram', 16: 'Tripura',
    17: 'Meghalaya', 18: 'Assam', 19: 'West Bengal', 20: 'Jharkhand', 21: 'Odisha', 22: 'Chhattisgarh',
    23: 'Madhya Pradesh', 24: 'Gujarat', 26: 'Dadra & Nagar Haveli and Daman & Diu', 27: 'Maharashtra',
    29: 'Karnataka', 30: 'Goa', 31: 'Lakshadweep', 32: 'Kerala', 33: 'Tamil Nadu', 34: 'Puducherry',
    35: 'Andaman & Nicobar', 36: 'Telangana', 37: 'Andhra Pradesh', 38: 'Ladakh'
  }
  return states[code] || ('State code ' + (isNaN(code) ? '?' : code))
}