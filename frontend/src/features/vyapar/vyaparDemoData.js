// VYAPAR OS / GADDI HUB - SIMULATED DEMO DATASET
// Client: Lakshya Traders | Jabalpur, MP
// High-Fidelity Enterprise Simulation

export const DEMO_CONFIG = {
  clientName: "Lakshya Traders",
  location: "Jabalpur, Madhya Pradesh",
  jurisdiction: "Gaddi Head Office, Dixit Pride Commercial Complex, Wright Town, Jabalpur",
  currencySymbol: "₹",
  demoMode: true,
  lastReconciledTime: "Today at 05:45 PM",
  operatingDate: "11 Oct 2026",
};

// 1. EXECUTIVE SUMMARY METRICS
export const EXECUTIVE_METRICS = {
  todayExpectedCollection: 1284500,
  todayReportedCollection: 1142200,
  todayVerifiedCollection: 1023900,
  cashAwaitingDeposit: 118300, // Agent Bag Float / Custody
  cashDepositedVerified: 903400,
  outstandingReceivables: 8462000,
  overdueReceivables: 984000,
  
  // Physical Vault
  openingVaultCash: 845000,
  verifiedCashInflows: 903400,
  verifiedCashOutflows: 695400,
  expectedClosingVaultCash: 1053000, // 845000 + 903400 - 695400
  actualCountedVaultCash: 1048500,
  unreconciledVaultVariance: -4500, // Discrepancy under investigation
  
  // Digital Isolation (NEVER added to physical vault)
  digitalCollectionTotal: 472800,
  bankBalanceICICI: 3418500,
  
  // Entity Breakdown
  verticals: [
    { id: "rojgari", name: "Rojgari Finance", code: "RF-JBP", expected: 380000, collected: 342000, verified: 310000, float: 32000, health: "good" },
    { id: "milk", name: "Milk Distribution OS", code: "MLK-100", expected: 540000, collected: 512000, verified: 486400, float: 25600, health: "warning" },
    { id: "hotel1", name: "The Narmada Grand", code: "H-NG", expected: 124500, collected: 118200, verified: 94200, float: 24000, health: "good" },
    { id: "hotel2", name: "Kalchuri Heritage & Suites", code: "H-KH", expected: 90000, collected: 80000, verified: 58300, float: 21700, health: "good" },
    { id: "parda_boli", name: "Parda Boli (Chit Auction)", code: "PB-BC", expected: 150000, collected: 90000, verified: 54500, float: 15000, health: "good" },
  ],
  
  // Critical Alerts
  actionableAlerts: [
    { id: "alt-1", severity: "critical", vertical: "MAHA-ROKAD", title: "Physical Vault Variance -₹4,500", desc: "Vault physical note count short by ₹4,500 against calculated closing of ₹10,53,000. Counter #2 evening shift discrepancy flagged for review.", time: "18 mins ago" },
    { id: "alt-2", severity: "warning", vertical: "MILK OS", title: "Route 14 (Adhartal) Stock Mismatch", desc: "Worker Mukesh Sahu reported 18 unsold pouches; physical crate return count logged as 12 pouches (6 pouches unaccounted).", time: "34 mins ago" },
    { id: "alt-3", severity: "amber", vertical: "ROJGARI", title: "Agent Sunil Patel Float Exceeds Limit", desc: "Sunil holds ₹28,400 un-deposited collection past 5:00 PM cutoff window. Mandatory gaddi handover pending.", time: "42 mins ago" },
    { id: "alt-4", severity: "info", vertical: "PARDA BOLI", title: "Auction Room #4 (Gold 20) Opens at 2:00 PM", desc: "20 verified members active. Anonymous identifiers locked. Minimum slide bid increment ₹2,500.", time: "1 hr ago" },
  ]
};

// 2. ROJGARI FINANCE: BORROWERS & LOANS
export const ROJGARI_BORROWERS = [
  {
    id: "BOR-101",
    name: "Rameshwar Dayal Kirana",
    contact: "+91 94251 *****",
    area: "Gorakhpur Market, Jabalpur",
    principal: 100000,
    dailyDue: 1200,
    totalTenureDays: 100,
    daysPaid: 64,
    totalRepaid: 76800,
    totalOutstanding: 43200,
    status: "Active",
    overdueDays: 0,
    assignedAgent: "Sunil Patel (AGT-01)",
    paymentModePreferred: "Cash",
    lastPaymentDate: "Today",
    lastPaymentAmount: 1200
  },
  {
    id: "BOR-102",
    name: "Maa Narmada Dairy & Sweets",
    contact: "+91 98261 *****",
    area: "Wright Town, Jabalpur",
    principal: 150000,
    dailyDue: 1800,
    totalTenureDays: 100,
    daysPaid: 82,
    totalRepaid: 147600,
    totalOutstanding: 32400,
    status: "Active",
    overdueDays: 0,
    assignedAgent: "Vikas Chouhan (AGT-02)",
    paymentModePreferred: "UPI",
    lastPaymentDate: "Today",
    lastPaymentAmount: 1800
  },
  {
    id: "BOR-103",
    name: "Jabalpur Auto Spare Parts",
    contact: "+91 93012 *****",
    area: "Adhartal Industrial Area",
    principal: 80000,
    dailyDue: 1000,
    totalTenureDays: 100,
    daysPaid: 45,
    totalRepaid: 45000,
    totalOutstanding: 55000,
    status: "Overdue",
    overdueDays: 4,
    assignedAgent: "Sunil Patel (AGT-01)",
    paymentModePreferred: "Cash",
    lastPaymentDate: "3 days ago",
    lastPaymentAmount: 1000
  },
  {
    id: "BOR-104",
    name: "Gupta Readymade Garments",
    contact: "+91 94243 *****",
    area: "Sarafa Bazar, Jabalpur",
    principal: 120000,
    dailyDue: 1500,
    totalTenureDays: 100,
    daysPaid: 91,
    totalRepaid: 136500,
    totalOutstanding: 13500,
    status: "Active",
    overdueDays: 0,
    assignedAgent: "Rakesh Tiwari (AGT-03)",
    paymentModePreferred: "Cash",
    lastPaymentDate: "Today",
    lastPaymentAmount: 1500
  },
  {
    id: "BOR-105",
    name: "Mahakaushal Electricals",
    contact: "+91 97531 *****",
    area: "Madan Mahal Station Road",
    principal: 200000,
    dailyDue: 2400,
    totalTenureDays: 100,
    daysPaid: 32,
    totalRepaid: 76800,
    totalOutstanding: 163200,
    status: "Overdue",
    overdueDays: 7,
    assignedAgent: "Vikas Chouhan (AGT-02)",
    paymentModePreferred: "Cash",
    lastPaymentDate: "6 days ago",
    lastPaymentAmount: 2400
  },
  {
    id: "BOR-106",
    name: "Shri Radhe Footwear",
    contact: "+91 99812 *****",
    area: "Lordganj, Jabalpur",
    principal: 50000,
    dailyDue: 600,
    totalTenureDays: 100,
    daysPaid: 58,
    totalRepaid: 34800,
    totalOutstanding: 25200,
    status: "Active",
    overdueDays: 0,
    assignedAgent: "Dinesh Mishra (AGT-04)",
    paymentModePreferred: "UPI",
    lastPaymentDate: "Today",
    lastPaymentAmount: 600
  }
];

// 3. FIELD COLLECTION AGENTS (ROJGARI & ENTERPRISE)
export const COLLECTION_AGENTS = [
  {
    id: "AGT-01",
    name: "Sunil Patel",
    phone: "+91 94251 11001",
    assignedRoute: "Gorakhpur & Adhartal Route",
    assignedBorrowersCount: 28,
    todayTarget: 34200,
    todayCollected: 31200,
    cashInHandBag: 28400, // Bag Float
    depositedToGaddi: 2800, // Cashier verified
    digitalUPICollected: 0,
    settlementStatus: "Pending Deposit",
    lastSyncTime: "12 mins ago"
  },
  {
    id: "AGT-02",
    name: "Vikas Chouhan",
    phone: "+91 98261 22002",
    assignedRoute: "Wright Town & Madan Mahal",
    assignedBorrowersCount: 32,
    todayTarget: 41800,
    todayCollected: 39400,
    cashInHandBag: 14200,
    depositedToGaddi: 21000,
    digitalUPICollected: 4200,
    settlementStatus: "Partially Deposited",
    lastSyncTime: "4 mins ago"
  },
  {
    id: "AGT-03",
    name: "Rakesh Tiwari",
    phone: "+91 93012 33003",
    assignedRoute: "Sarafa Bazar & Bada Fuhara",
    assignedBorrowersCount: 24,
    todayTarget: 31000,
    todayCollected: 31000,
    cashInHandBag: 0,
    depositedToGaddi: 31000,
    digitalUPICollected: 0,
    settlementStatus: "Fully Settled",
    lastSyncTime: "25 mins ago"
  },
  {
    id: "AGT-04",
    name: "Dinesh Mishra",
    phone: "+91 97531 44004",
    assignedRoute: "Lordganj & Sadar Cantt",
    assignedBorrowersCount: 22,
    todayTarget: 26400,
    todayCollected: 24600,
    cashInHandBag: 12600,
    depositedToGaddi: 12000,
    digitalUPICollected: 0,
    settlementStatus: "Pending Deposit",
    lastSyncTime: "18 mins ago"
  },
  {
    id: "AGT-05",
    name: "Amit Sen",
    phone: "+91 94243 55005",
    assignedRoute: "Ranjhi & Khamaria",
    assignedBorrowersCount: 19,
    todayTarget: 22800,
    todayCollected: 20400,
    cashInHandBag: 8400,
    depositedToGaddi: 12000,
    digitalUPICollected: 0,
    settlementStatus: "Pending Deposit",
    lastSyncTime: "30 mins ago"
  },
  {
    id: "AGT-06",
    name: "Pramod Lodhi",
    phone: "+91 99812 66006",
    assignedRoute: "Garha & Medical Collage Zone",
    assignedBorrowersCount: 25,
    todayTarget: 30000,
    todayCollected: 27600,
    cashInHandBag: 14600,
    depositedToGaddi: 13000,
    digitalUPICollected: 0,
    settlementStatus: "Pending Deposit",
    lastSyncTime: "8 mins ago"
  }
];

// 4. MILK DISTRIBUTION OS (~100 WORKERS DATASET GENERATOR)
// Generating full 100 workers with realistic distribution metrics
const JABALPUR_LOCALITIES = [
  "Wright Town", "Civil Lines", "Napier Town", "Madan Mahal", 
  "Vijay Nagar", "Gorakhpur", "Ranjhi", "Adhartal", 
  "Garha", "Sadar Cantt", "Ghamapur", "Khamaria", 
  "Kotwali", "Lordganj", "Bilhari", "Tilhari", "Gupteshwar", "Bhedaghat Rd"
];

const WORKER_FIRST_NAMES = [
  "Ramesh", "Suresh", "Mukesh", "Dharmendra", "Santosh", 
  "Rajesh", "Vinod", "Manoj", "Anil", "Kamlesh", 
  "Deepak", "Sunil", "Pawan", "Hemant", "Mahesh", 
  "Ajay", "Bablu", "Guddu", "Kallu", "Sanjay", 
  "Satish", "Ashok", "Kailash", "Gopal", "Mohan"
];

const WORKER_LAST_NAMES = ["Yadav", "Patel", "Sahu", "Parihar", "Chouhan", "Kushwaha", "Tiwari", "Sharma", "Lodhi", "Burman"];

export const MILK_WORKERS_100 = Array.from({ length: 100 }, (_, i) => {
  const idNum = String(i + 1).padStart(3, "0");
  const firstName = WORKER_FIRST_NAMES[i % WORKER_FIRST_NAMES.length];
  const lastName = WORKER_LAST_NAMES[(i * 3) % WORKER_LAST_NAMES.length];
  const route = `${JABALPUR_LOCALITIES[i % JABALPUR_LOCALITIES.length]} Route #${(i % 5) + 1}`;
  
  // Stock Issued in Liters (crates of 500ml / 1L pouches)
  const issuedLiters = 120 + ((i * 7) % 80);
  const ratePerLiter = 64; // ₹64/L toned/full cream average
  
  const damagedLiters = (i % 11 === 0) ? 2 : (i % 23 === 0) ? 4 : 0;
  const returnedUnsold = (i % 7 === 0) ? 6 : (i % 13 === 0) ? 10 : 0;
  const deliveredLiters = issuedLiters - returnedUnsold - damagedLiters;
  
  const totalValue = deliveredLiters * ratePerLiter;
  const creditSales = (i % 4 === 0) ? Math.round(totalValue * 0.25) : 0;
  const digitalSales = (i % 3 === 0) ? Math.round(totalValue * 0.15) : 0;
  const expectedCash = totalValue - creditSales - digitalSales;
  
  // Variance simulation on certain workers
  const cashDiscrepancy = (i === 13) ? -320 : (i === 41) ? -540 : 0;
  const actualCashDeposited = expectedCash + cashDiscrepancy;
  
  let settlementStatus = "Settled";
  if (cashDiscrepancy !== 0) settlementStatus = "Discrepancy";
  else if (i % 5 === 0) settlementStatus = "Pending Verification";
  else if (i % 8 === 0) settlementStatus = "On Route";

  return {
    workerId: `MW-${idNum}`,
    name: `${firstName} ${lastName}`,
    phone: `+91 94250 ${String(10000 + i * 37).slice(0, 5)}`,
    route: route,
    assignedCrates: Math.ceil(issuedLiters / 12),
    stockIssuedLiters: issuedLiters,
    deliveredLiters: deliveredLiters,
    returnedUnsoldLiters: returnedUnsold,
    damagedLiters: damagedLiters,
    totalSalesValue: totalValue,
    creditSales: creditSales,
    digitalSales: digitalSales,
    expectedCash: expectedCash,
    actualCashDeposited: actualCashDeposited,
    variance: cashDiscrepancy,
    settlementStatus: settlementStatus
  };
});

// 5. MAHA-ROKAD: MASTER CASH VAULT SESSIONS & DENOMINATIONS
export const VAULT_PHYSICAL_COUNT = {
  denominations: [
    { note: "₹500", count: 1820, value: 910000 },
    { note: "₹200", count: 480, value: 96000 },
    { note: "₹100", count: 325, value: 32500 },
    { note: "₹50", count: 140, value: 7000 },
    { note: "₹20", count: 125, value: 2500 },
    { note: "₹10", count: 50, value: 500 }
  ],
  totalActualCount: 1048500
};

export const MAHA_ROKAD_TRANSACTIONS = [
  { id: "TXN-8801", time: "09:15 AM", type: "Opening Balance", vertical: "VAULT", desc: "Day Opening Physical Vault Balance", mode: "Physical Cash", debit: 0, credit: 845000, balance: 845000, verifiedBy: "Head Cashier (Pravin)" },
  { id: "TXN-8802", time: "10:30 AM", type: "Outflow", vertical: "ROJGARI", desc: "Disbursement Loan #BOR-107 & #BOR-108", mode: "Physical Cash", debit: 150000, credit: 0, balance: 695000, verifiedBy: "Loan Officer Soni" },
  { id: "TXN-8803", time: "12:15 PM", type: "Inflow", vertical: "HOTEL 1", desc: "The Narmada Grand Morning Cash Desk Handover", mode: "Physical Cash", debit: 0, credit: 94200, balance: 789200, verifiedBy: "Hotel Desk Sharma" },
  { id: "TXN-8804", time: "01:45 PM", type: "Outflow", vertical: "MILK OS", desc: "Raw Milk Chilling Center Dairy Procurement Cash", mode: "Physical Cash", debit: 310000, credit: 0, balance: 479200, verifiedBy: "Dairy Incharge" },
  { id: "TXN-8805", time: "02:50 PM", type: "Inflow", vertical: "PARDA BOLI", desc: "BC Group #4 Monthly Cash Installments (10 Members)", mode: "Physical Cash", debit: 0, credit: 150000, balance: 629200, verifiedBy: "Foreman Gaddi" },
  { id: "TXN-8806", time: "03:15 PM", type: "Outflow", vertical: "PARDA BOLI", desc: "BC Winner Auction Payout - Cash Component", mode: "Physical Cash", debit: 185000, credit: 0, balance: 444200, verifiedBy: "Foreman Gaddi" },
  { id: "TXN-8807", time: "04:10 PM", type: "Inflow", vertical: "HOTEL 2", desc: "Kalchuri Heritage Front Desk Cash Handover", mode: "Physical Cash", debit: 0, credit: 58300, balance: 502500, verifiedBy: "Desk Incharge Patel" },
  { id: "TXN-8808", time: "04:45 PM", type: "Inflow", vertical: "ROJGARI", desc: "Agent Rakesh & Vikas Batch Cash Deposit", mode: "Physical Cash", debit: 0, credit: 214500, balance: 717000, verifiedBy: "Cashier Counter 1" },
  { id: "TXN-8809", time: "05:15 PM", type: "Inflow", vertical: "MILK OS", desc: "Milk OS Evening Workers Batch Settlement (Counter #1 & #2)", mode: "Physical Cash", debit: 0, credit: 386400, balance: 1103400, verifiedBy: "Cashier Counter 2" },
  { id: "TXN-8810", time: "05:30 PM", type: "Outflow", vertical: "ADMIN", desc: "Gaddi Office Staff Tea/Travel & Petty Expenses", mode: "Physical Cash", debit: 50400, credit: 0, balance: 1053000, verifiedBy: "Accountant" },
];

// 6. PARDA BOLI (BC CHIT FUND AUCTION)
export const PARDA_BOLI_ACTIVE_AUCTION = {
  chitId: "CHIT-GOLD-04",
  groupName: "Maha-Lakshya Gold Chit Group IV",
  chitValue: 1000000, // ₹10 Lakhs
  totalMembers: 20,
  currentMonth: 7,
  totalMonths: 20,
  monthlyInstallmentGross: 50000,
  auctionWindow: "2:00 PM – 4:00 PM",
  remainingSeconds: 3840, // Live countdown
  status: "LIVE_BIDDING_ACTIVE",
  minimumBidFloor: 750000,
  currentWinningBid: 825000,
  currentWinningBidderAnonymous: "Bidder #108",
  bidHistory: [
    { id: "BID-901", time: "02:14 PM", bidder: "Bidder #114", amount: 950000, status: "Outbid" },
    { id: "BID-902", time: "02:35 PM", bidder: "Bidder #102", amount: 910000, status: "Outbid" },
    { id: "BID-903", time: "02:58 PM", bidder: "Bidder #119", amount: 880000, status: "Outbid" },
    { id: "BID-904", time: "03:12 PM", bidder: "Bidder #105", amount: 850000, status: "Outbid" },
    { id: "BID-905", time: "03:31 PM", bidder: "Bidder #108", amount: 825000, status: "Current Winner" },
  ],
  calculatedDividendPerMember: 8750, // (10,00,000 - 8,25,000) = 1,75,000 discount / 20 members
  netInstallmentPayable: 41250 // 50,000 - 8,750 dividend
};

// 7. DUAL HOTELS MANAGEMENT
export const DUAL_HOTELS_DATA = {
  hotel1: {
    id: "H-NG",
    name: "The Narmada Grand",
    tagline: "Luxury Riverside Hospitality & Banquets",
    location: "Gwarighat Road, Near Narmada Riverfront, Jabalpur",
    totalRooms: 42,
    occupiedRooms: 35,
    occupancyRate: "83.3%",
    checkInsToday: 14,
    checkOutsToday: 11,
    todayRevenue: 184500,
    cashRevenue: 94200,
    digitalRevenue: 90300,
    pettyExpenses: 14500,
    roomCategories: [
      { name: "Royal Narmada River View Suite", total: 6, booked: 6, rate: 8500 },
      { name: "Executive Club Deluxe", total: 16, booked: 14, rate: 4500 },
      { name: "Superior Heritage Room", total: 20, booked: 15, rate: 3200 }
    ],
    features: ["Riverside Terrace", "Grand Banquet (600 pax)", "Pure Veg Royal Dine", "High-Speed WiFi", "Valet Parking"]
  },
  hotel2: {
    id: "H-KH",
    name: "Kalchuri Heritage & Suites",
    tagline: "Boutique Business Hotel in Commercial Hub",
    location: "Civil Lines, Near High Court & Station, Jabalpur",
    totalRooms: 28,
    occupiedRooms: 20,
    occupancyRate: "71.4%",
    checkInsToday: 8,
    checkOutsToday: 6,
    todayRevenue: 98000,
    cashRevenue: 58300,
    digitalRevenue: 39700,
    pettyExpenses: 8200,
    roomCategories: [
      { name: "Presidential Business Suite", total: 4, booked: 3, rate: 6500 },
      { name: "Corporate Executive Room", total: 14, booked: 11, rate: 3800 },
      { name: "Classic Comfort Room", total: 10, booked: 6, rate: 2600 }
    ],
    features: ["Boardroom (25 pax)", "Central AC", "24/7 Room Service", "Airport Shuttle", "Doctor on Call"]
  }
};
