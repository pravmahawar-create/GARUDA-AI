// Domain-aware business intelligence: reusable domain profiles.
// The GENERIC billing core stays domain-neutral; these profiles supply vocabulary,
// aliases, units and business-specific interpretation for voice understanding.

// Core units reusable by every domain (never remove).
export const CORE_UNITS = {
  kg: 'kg', kilo: 'kg', kgg: 'kg',
  gram: 'gram', g: 'gram', gm: 'gram',
  piece: 'piece', pcs: 'piece', pieces: 'piece',
  box: 'box', packet: 'packet', pack: 'packet',
  litre: 'litre', liter: 'litre', ltr: 'litre',
  meter: 'meter', metre: 'meter',
  ton: 'ton', tan: 'ton', tonne: 'ton', quintal: 'quintal', qtl: 'quintal'
}

const BUILDING_MATERIAL = {
  key: 'building-material',
  label: 'Building Material / Loha / Cement',
  units: {
    bag: 'bag', bori: 'bag', bags: 'bag',
    truck: 'truck', gadi: 'truck', trolley: 'trolley'
  },
  productAliases: {
    cement: 'Cement', semento: 'Cement', siment: 'Cement',
    sariya: 'TMT Steel', sariyaa: 'TMT Steel', rod: 'TMT Steel', tmt: 'TMT Steel', steel: 'TMT Steel',
    sand: 'Sand', ret: 'Sand', bricks: 'Bricks', eent: 'Bricks', int: 'Bricks'
  },
  brandCase: {
    acc: 'ACC', tmt: 'TMT', tata: 'Tata', ultratech: 'UltraTech', ambuja: 'Ambuja', shree: 'Shree',
    jk: 'JK', dalmia: 'Dalmia', bangur: 'Bangur', birla: 'Birla', fortune: 'Fortune', gk: 'GK',
    kamdhenu: 'Kamdhenu', isi: 'ISI', raipur: 'Raipur', laxmi: 'Laxmi', jklaxmi: 'JK Laxmi',
    wonder: 'Wonder', prism: 'Prism', ramco: 'Ramco', mycem: 'MyCem'
  },
  categoryTokens: {
    cement: 'cement', siment: 'cement', semento: 'cement',
    steel: 'steel', sariya: 'steel', sariyaa: 'steel', rod: 'steel', tmt: 'steel',
    sand: 'other', ret: 'other', bricks: 'other', eent: 'other', int: 'other'
  },
  stockHint: /(stock|stok|aaya hai|aayi hai|aa gaya|aa gayi|aagaya|aagayi|pahunch|pahonch|add karo|add kar do|daal do|dalo|jod|jodo|jod do|badh|badha|minus|mines|mine|kam karo|ghata|nikal|nikaal|hatao|becha|bech diya|bech diye|gaadi|gadi|vehicle|inward|history|last\s*(?:incoming|entry)|kis\s*gaadi|kitna\s*aaya|kitna\s*aayi|kitni\s*aaya|kitni\s*aayi|\baaya\b|\baayi\b|\baaye\b|(cement|sariya|steel|tmt|sand|bricks|eent).*(kitna|kitni|kitne)|(kitna|kitni|kitne|total).*(cement|sariya|steel|tmt|bori|stock)|kitni\s*bori|padi\s*hai|pada\s*hai)/i
}

// Minimal proof profile: proves the parser is domain-aware without adding grocery business logic.
const GROCERY = {
  key: 'grocery',
  label: 'Grocery / Kirana',
  units: { gram: 'gram', packet: 'packet', box: 'box' },
  productAliases: {
    sugar: 'Sugar', cheeni: 'Sugar', chiini: 'Sugar', shugar: 'Sugar',
    atta: 'Atta', aata: 'Atta',
    rice: 'Rice', chawal: 'Rice',
    oil: 'Oil', tel: 'Oil',
    dal: 'Dal'
  },
  brandCase: {},
  categoryTokens: {},
  stockHint: /(stock|stok|add|minus|kitna|aaya hai|aayi hai)/i
}

const HOTEL = {
  key: 'hotel',
  label: 'Hotel / MMSR / Restaurant',
  units: {
    plate: 'plate', plates: 'plate',
    serving: 'serving', servings: 'serving',
    glass: 'glass', glasses: 'glass',
    bottle: 'bottle', bottles: 'bottle',
    room: 'room', rooms: 'room', night: 'night', nights: 'night',
    person: 'person', persons: 'person', guest: 'guest', guests: 'guest'
  },
  productAliases: {
    roti: 'Roti', chapati: 'Roti',
    dal: 'Dal',
    rice: 'Rice', chawal: 'Rice',
    water: 'Water', pani: 'Water',
    'cold drink': 'Cold Drink', cola: 'Cold Drink',
    tea: 'Tea', chai: 'Tea',
    coffee: 'Coffee',
    thali: 'Thali',
    sabji: 'Sabji', vegetable: 'Sabji',
    paneer: 'Paneer',
    chicken: 'Chicken', mutton: 'Mutton',
    fish: 'Fish',
    icecream: 'Ice Cream',
    dessert: 'Dessert'
  },
  brandCase: {},
  categoryTokens: {},
  stockHint: /(stock|stok|add|minus|kitna)/i
}

const PROFILES = { 'building-material': BUILDING_MATERIAL, grocery: GROCERY, hotel: HOTEL }

export function resolveProfile(company) {
  const key = company && company.activeDomainKey
  if (key && PROFILES[key]) return PROFILES[key]
  const cat = (company && company.category || '').toLowerCase()
  if (/hotel|hospitality|restaurant|mmr|mmrs|catering/.test(cat)) return HOTEL
  if (/grocery|kirana|general store|retail/.test(cat)) return GROCERY
  if (/trading|hardware|steel|cement|loha|building|material/.test(cat)) return BUILDING_MATERIAL
  return BUILDING_MATERIAL // default: current application behavior, never break existing companies
}

export function getProfile(key) { return PROFILES[key] || BUILDING_MATERIAL }

export function unitsFor(domain) {
  return { ...CORE_UNITS, ...((domain && domain.units) || {}) }
}
