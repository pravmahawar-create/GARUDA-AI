# GARUDA BILLING — FUTURE PLANNING PROPOSAL

> Status: SAVED FOR FUTURE. Abhi saara kaam OFFLINE / inbuilt (local) model par chal raha hai.
> Ye file future milestones ke liye reference hai — abhi implement NAHI karna.

## 1. CURRENT DECISION (abhi ke liye)
- **Offline-first local parser** = primary understanding engine.
- **Google Gemini / cloud AI = disabled** (`voiceAI.js` key ke bina inactive). Mat touch karna jab tak explicitly na bola jaye.
- APK clients ko share karne se pehle key-safety hona zaroori hai.

## 2. Why Gemini key is risky in the APK
- APK ek ZIP hai — koi bhi (apktool se) key nikaal sakta hai.
- Free tier quota kam hai; 10+ clients par jaldi khatam.
- Paid/quota key ke misuse se **tumhara bill/quota** ghat sakta hai.

## 3. Investor strategy (Delhi investor, Jabalpur dev)
- Investor demo ke liye: **ek flawless OFFLINE voice demo** (bill + stock + khata + vehicle ek baat mein).
- Uske liye premium UI polish (business card, templates, dashboard) + PDF — ye sab local hai, Gemini ki zaroorat nahi.
- Gemini/cloud sirf "next evolution" pitch ke liye.

## 4. Future: Cloud Intelligence (backend-first)
- Ek chhota backend (server) jo API key rakhe. App server se baat kare.
- Server: Gemini parsing + optional voice transcription + photo OCR.
- App side: `voiceAI.js` ka integration layer pehle se ready hai — bas server URL point karna.
- Ye investor-ready security architecture hai.

## 5. garudaos.in — client search/marketing
- Website abhi **marketing/lead-gen** ke liye.
- Future: account/backup/sync portal, installer downloads, plans.

## 6. Future feature backlog
| Area | Detail |
|---|---|
| Actual weight billing | 1465/1525/1640 kg se bill — capacity = limit, billing unit nahi |
| Rate conversion | kg ↔ quintal ↔ ton, with/without tax |
| Order → Trip → Delivery → Bill → Reconciliation | 1 commercial bill + multiple trips |
| Vehicle delivery history | "MP20AB1234 ki delivery dikhao" |
| Backdated billing | "2-6 tareekh ke bills bana do" |
| Constraint advisory | "date/vehicle kam hai" |
| Stock sufficiency | "25 ton chahiye, 18 ton hai" |
| Monthly GST record | input/output, GST vs Non-GST sales |
| Photo upload → AI parse | GSTIN, items, amounts (vision API) |
| Cloud/multi-device sync | backup + multi-user |
| Devanagari name → Latin | customer link ke liye |
| Premium polish | business card, templates, dashboard |

## 7. Current on-device issues already fixed (this round)
- "tan" → ton unit (STT variant)
- standalone "aaya/aayi/aaye" → stock
- Show UPI crash (React #290 — `ref` string prop)
- Khata PDF share via Capacitor Share
- Junk "Stock" item pollution in stock query
- Customer name garbage ("bag ACC") rejection
