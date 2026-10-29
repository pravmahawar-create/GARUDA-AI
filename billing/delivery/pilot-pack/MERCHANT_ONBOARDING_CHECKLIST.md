# GARUDA Billing — Merchant Onboarding Checklist

Use this 10-minute checklist during the first customer onboarding session:

### Phase 1: Device Readiness
- [ ] Confirm target device is Android (v7.0+).
- [ ] Install `GARUDA_Billing_v1.11_Release.apk`.
- [ ] Grant Audio / Microphone permission on first boot.
- [ ] (Optional) Set a 4-digit Passcode PIN if device is shared with employees/family.

### Phase 2: Shop Profile Configuration (`Settings / Companies`)
- [ ] **Dukaan Ka Naam (Shop Name):** Enter registered business/trade name.
- [ ] **Address & Phone:** Enter shop address and contact number.
- [ ] **GSTIN (Optional):** Enter 15-digit GSTIN (if registered) or leave blank for non-GST trading.
- [ ] **Bank & UPI Setup:** Enter Merchant UPI ID (e.g., `shopname@okaxis`, `merchant@upi`) and Account/IFSC to print direct payment QR on invoices.
- [ ] **Invoice Template:** Select visual theme (`Classic Green`, `Modern Blue`, `Premium Gold`, `Minimal Dark`).

### Phase 3: Opening Stock Setup (`Stock / Inventory`)
- [ ] Add primary cement brands (e.g. UltraTech, ACC, Ambuja, Birla) with opening bag count and default selling rate.
- [ ] Add TMT Steel / Sariya categories (e.g. 8mm, 10mm, 12mm) in piece or kg.
- [ ] (Optional) Add local materials (Bricks, Sand/Reti) with default unit.

### Phase 4: Hands-on Voice Test
- [ ] Merchant taps microphone and speaks: *"Ramesh ke naam 50 bag ACC cement 390 ke rate se bill bana do"*.
- [ ] Verify customer name, item, quantity, and rate appear on screen.
- [ ] Tap **Confirm & Create Bill**.
- [ ] Verify invoice preview displays calculated GST/total and embedded UPI QR.
- [ ] Tap **Share PDF** to send invoice to merchant's WhatsApp.

### Phase 5: Backup Training
- [ ] Open `Settings` -> Tap **Backup Data**.
- [ ] Verify JSON backup file is saved to device Downloads.
