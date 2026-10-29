# GARUDA Billing (v1.11) — Product Scope & Limitations

## 1. Scope of Included Capabilities (What the Product Does)
- **100% Offline Database:** Powered by local IndexedDB (Dexie). All data stays strictly on the merchant's physical phone. Zero internet required for billing, stock, or reporting.
- **Hindi Voice NLU Engine:** Deterministic on-device voice understanding for Indian building materials (Cement, TMT Steel Sariya, Sand/Reti, Bricks/Eent) and multi-turn conversations.
- **Dual GST & Kaccha Separation:** Separate invoice numbering and books for Tax Invoices (`INV-XXX`) and Non-GST bills (`K-XXX`).
- **GSTR-1 CSV Export:** One-tap export of standard GST sales CSV ready for accountant / CA filing.
- **Customer Khata (Ledger):** Tracks credit sales, payment history, and customer dues.
- **Instant 0% Fee UPI QR:** Dynamic NPCI-compliant UPI QR code embedded into generated A4 PDFs.
- **Local Backup & Recovery:** 1-tap JSON export and restore for safety.

---

## 2. Explicit Product Limitations & Exclusions (What the Product Does NOT Do)
- **Zero Cloud Auto-Sync:** Does not synchronize data across multiple devices automatically in v1.11. Data lives on the single installed device.
- **Zero Automatic Bank Scraping:** The app prints the merchant's UPI QR code so customers can pay via PhonePe/GPay/Paytm. **The app does NOT read bank SMS or verify bank credits automatically.** The merchant must check their own bank SMS or UPI soundbox before releasing goods.
- **No Bluetooth Thermal Receipt Printer Automation in Core Scope:** v1.11 natively generates standard A4 PDF documents optimized for WhatsApp sharing and standard Android system printing. Physical 2-inch/3-inch thermal ESC/POS roll printing is not guaranteed without external printer drivers.
- **Environmental Mic Limitations:** Voice recognition accuracy is dependent on the device's physical microphone quality and ambient noise. In extremely noisy environments (e.g. running cement mixers), manual touchscreen input should be used.
