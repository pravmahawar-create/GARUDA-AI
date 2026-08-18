// Industry guides — how GARUDA helps each lawful operation.
// Every guide is capabilities-based (leads, follow-up, scheduling, records,
// compliance, payments) — no fabricated outcomes or figures.

export const INDUSTRY_GUIDES = [
  {
    id: "legal",
    name: "Lawyers & Legal",
    icon: "⚖",
    summary: "Client enquiries, consultation scheduling, and matter follow-up without losing a lead.",
    howGarudaHelps: [
      "Capture enquiries from website and directories with source + context",
      "Schedule consultations and reminders so no client is missed",
      "Track matters, deadlines, and follow-ups in one queue",
      "Draft professional replies from your own knowledge base, founder-approved",
      "Log retainers and payments with verification evidence"
    ]
  },
  {
    id: "doctors",
    name: "Doctors & Clinics",
    icon: "⚕",
    summary: "Appointment flow, patient reminders, and records handled with discipline.",
    howGarudaHelps: [
      "Book appointments and reduce no-shows with automated reminders",
      "Follow up on reports, tests, and referrals on schedule",
      "Keep patient records organised and retrievable",
      "Reply to patient enquiries promptly with approved templates",
      "Manage billing and payments with a clear audit trail"
    ]
  },
  {
    id: "hospitals",
    name: "Hospital & Healthcare",
    icon: "✚",
    summary: "Multi-department coordination for admissions, visits, and follow-ups.",
    howGarudaHelps: [
      "Route admissions and OPD enquiries to the right department",
      "Track follow-up visits and discharge instructions",
      "Monitor compliance checklists and documentation",
      "Communicate with patients via approved, professional channels",
      "Log payments and settlements with evidence"
    ]
  },
  {
    id: "hotels",
    name: "Hotels & Inns",
    icon: "🏨",
    summary: "Direct bookings, guest follow-up, and reviews handled without OTA dependency.",
    howGarudaHelps: [
      "Capture direct booking enquiries from website and WhatsApp",
      "Check availability and reply within minutes, not days",
      "Follow up with guests pre-arrival and post-stay",
      "Track special requests and housekeeping tasks",
      "Manage deposits, invoices, and payment verification"
    ]
  },
  {
    id: "restaurants",
    name: "Restaurants & Cafés",
    icon: "🍽",
    summary: "Reservations, private events, and repeat customers managed cleanly.",
    howGarudaHelps: [
      "Take reservations from calls, website, and social channels",
      "Follow up on event and catering enquiries with quotes",
      "Manage delivery and pickup order queues",
      "Track repeat customers and loyalty touchpoints",
      "Log payments and reconcile daily settlements"
    ]
  },
  {
    id: "ca",
    name: "CA & Auditors",
    icon: "▤",
    summary: "Client onboarding, deadlines, and compliance calendars without chaos.",
    howGarudaHelps: [
      "Capture new client enquiries with context",
      "Track filing deadlines and compliance calendars",
      "Schedule follow-ups for documents and signatures",
      "Draft professional client communication from your knowledge base",
      "Log engagements and payments with verification evidence"
    ]
  },
  {
    id: "realestate",
    name: "Real Estate",
    icon: "▣",
    summary: "Site-visit scheduling, lead follow-up, and deal tracking in one flow.",
    howGarudaHelps: [
      "Capture property enquiries from all channels",
      "Schedule site visits and send reminders",
      "Qualify buyers and sellers with structured questions",
      "Track deals through the pipeline with clear next steps",
      "Log token amounts and payments with evidence"
    ]
  },
  {
    id: "schools",
    name: "Schools & Coaching",
    icon: "◎",
    summary: "Admissions, fee follow-up, and parent communication made reliable.",
    howGarudaHelps: [
      "Capture admission enquiries and tour requests",
      "Follow up on applications and document submissions",
      "Schedule classes, batches, and counselling calls",
      "Send fee reminders and payment receipts",
      "Answer common parent questions instantly from your knowledge base"
    ]
  },
  {
    id: "gyms",
    name: "Gyms & Wellness",
    icon: "⌖",
    summary: "Trial sign-ups, membership renewals, and class reminders automated.",
    howGarudaHelps: [
      "Capture trial and membership enquiries",
      "Schedule demos and fitness assessments",
      "Remind members about renewals and class bookings",
      "Track attendance and trainer follow-ups",
      "Manage memberships and payments with clean records"
    ]
  },
  {
    id: "dental",
    name: "Dental & Diagnostics Labs",
    icon: "◉",
    summary: "Appointments, report delivery, and recall reminders handled smoothly.",
    howGarudaHelps: [
      "Book appointments and reduce no-shows with reminders",
      "Notify patients when reports are ready",
      "Schedule recall and follow-up treatments on time",
      "Reply to patient questions with approved templates",
      "Log billing and payments with a clear trail"
    ]
  },
  {
    id: "retail",
    name: "Retail & Stores",
    icon: "◈",
    summary: "Enquiries, orders, and repeat customers managed from one command center.",
    howGarudaHelps: [
      "Capture enquiries from website and social channels",
      "Track orders, quotes, and follow-ups",
      "Remind customers about restocks and offers",
      "Answer common questions with your own policies",
      "Log payments and reconcile daily settlements"
    ]
  },
  {
    id: "salons",
    name: "Salons & Spas",
    icon: "✿",
    summary: "Bookings, packages, and client follow-up without double-booking.",
    howGarudaHelps: [
      "Take bookings across staff and services",
      "Send appointment reminders and reduce no-shows",
      "Follow up on packages and return visits",
      "Track gift cards and memberships",
      "Log payments with verification evidence"
    ]
  },
  {
    id: "agencies",
    name: "Digital Marketing Agencies",
    icon: "✉",
    summary: "Lead flow, client reporting, and deliverables kept on schedule.",
    howGarudaHelps: [
      "Capture inbound leads with source and budget context",
      "Draft proposals and follow up on schedule",
      "Track deliverables and deadlines per client",
      "Report progress with evidence, not guesswork",
      "Manage invoices and payment verification"
    ]
  },
  {
    id: "manufacturing",
    name: "Factories & Manufacturers",
    icon: "▥",
    summary: "Vendor enquiries, order follow-ups, and dispatch tracking simplified.",
    howGarudaHelps: [
      "Capture purchase enquiries with specifications",
      "Track quotations, orders, and dispatch dates",
      "Follow up on payments and pending approvals",
      "Maintain supplier and buyer records",
      "Monitor compliance documentation"
    ]
  }
];

export const getIndustryGuide = (id) =>
  INDUSTRY_GUIDES.find((guide) => guide.id === id) || null;