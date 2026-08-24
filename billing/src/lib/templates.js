export const TEMPLATES = [
  { id: 'classic', name: 'Classic', tagline: 'Simple, sada, solid', accent: '#0b3d2e' },
  { id: 'modern', name: 'Modern', tagline: 'Colored header band, clean', accent: '#0f4c81' },
  { id: 'premium', name: 'Premium', tagline: 'Rich dark header + gold, signature', accent: '#1a1a2e' },
  { id: 'minimal', name: 'Minimal', tagline: 'Elegant, whitespace, subtle', accent: '#3a3a3a' },
  { id: 'transport', name: 'Transport+Bill', tagline: 'Delivery/vehicle highlighted', accent: '#b45309' }
]

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}

export const SAMPLE_INVOICE = {
  invoiceNo: 1042,
  date: '2026-08-20',
  customerName: 'Ramesh Kumar',
  customer: { name: 'Ramesh Kumar', mobile: '9826000000', gstin: '23AAFCK1234R1Z7', address: 'Bhopal, MP' },
  items: [
    { name: 'Cement - ACC 50kg', qty: 50, unit: 'bag', rate: 390, amount: 19500, hsn: '2523' },
    { name: 'TMT Steel 10mm', qty: 2, unit: 'ton', rate: 58000, amount: 116000, hsn: '7214' }
  ],
  totals: {
    subtotal: 135500,
    discount: 0,
    gstRate: 18,
    cgst: 12195,
    sgst: 12195,
    freight: 2500,
    loading: 0,
    unloading: 0,
    grandTotal: 150390
  },
  transport: { vehicleNo: 'MP20AB1234', driverName: 'Rakesh', driverMobile: '9876543210', site: 'Bhopal Site', lrNo: 'LR-88' }
}

export const SAMPLE_COMPANY = {
  name: 'Your Business Name',
  category: 'Business Type',
  logo: '',
  ownerName: '',
  website: '',
  whatsapp: '',
  email: '',
  gstin: '',
  address: 'Your Address',
  phone: 'Your Phone',
  gstRate: 18
}