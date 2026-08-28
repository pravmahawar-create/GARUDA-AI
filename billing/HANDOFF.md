# GARUDA Billing — Voice Order Flow Handoff

**Date:** 2026-08-26  
**Status:** Order conversational flow implemented — 262/262 tests passing, APK built & installed on device.

---

## ✅ COMPLETED THIS SESSION (Order flow implementation)

### A. `src/lib/conversation.js`
- `orderFresh()` now includes `capacity` / `capacityUnit` fields
- `orderMissing()` now requires `capacity` when vehicle numbers exist
- `orderSummary()` now shows `Capacity`
- `parseOrderFields()` upgraded:
  - Hindi number words (`ek/do/teen/char/panch/...`) for vehicle count & trips
  - Bare date without month (`"2 se 6 tareekh"`) → current month dates
  - Capacity extraction (`"1500 kg"`, `"capacity 1500 kg"`)
  - Vehicle numbers with spaces (`"MP 20 AB 1234"`) + contiguous (`"MP20AB1234"`), dedup + preserve multiple
- Order branch condition fixed:
  - **Bug:** `pendingOrder` was a boolean — `pendingOrder.value` was `undefined` → order branch never entered for follow-ups. Fixed to `c.order && !c.order.executed && c.order`
  - Added `orderContKey` / `VEH_REGEX` / `hasCapacityOnly` to route follow-up turns (vehicle nos, capacity, dates, rates) into the active order draft
- Order cancel: `cancel/rehne do/mat banao` clears order draft (`c.order = null`)
- `isConfirm()` now accepts `"haan bana do"`, `"haan kar do"`, `"haan bilkul"`, and `haan/han/yes` prefixed phrases

### B. `src/components/VoiceModal.jsx`
- Added `orderDraft` state
- `order_needs_info` / `order_confirm` handlers populate `orderDraft`
- `order_execute` clears `orderDraft` after success
- Order draft UI card added (Customer, Amount, Product, Rate, Dates, Vehicles, Capacity, Trips/day)
- "Confirm & Create Order" + "Cancel" buttons shown when order is complete

### C. Tests (`src/lib/conversation.test.js`) — 8 new order tests
1. initial intent → order_needs_info
2. multi-turn customer + amount preserved, date follow-up
3. vehicle capture via number
4. multiple vehicles preserved
5. capacity follow-up fills field
6. rate follow-up
7. complete draft → order_confirm → order_execute
8. cancel clears order draft

**Test result: 262/262 passing** (254 original + 8 new)

### D. Build & Device
- `npm run build` ✓ · `npx cap sync android` ✓ · `gradlew assembleDebug` ✓
- APK: `billing/android/app/build/outputs/apk/debug/app-debug.apk`
- Installed on `ZN52238XJ9` (adb install -r, data preserved)

---

## ✅ Earlier Work (previous session)

### 1. `detectOrderIntent` fixed in `src/lib/voice.js`
- **Problem:** Multi-trip order commands like `"10 लाख का बिल बना दो 2 से 5 जुलाई तीन गाड़ियां"` were mis-routed to `stock_query` because `STOCK_HINT` matched `gaadi` before order intent could be detected.
- **Fix:** Added `export function detectOrderIntent(text)` before the stock check in `parseLocal()`. Order intent is now detected BEFORE stock intent.
- **Change:** `hasAmount` → `hasLakh` (only `lakh|lac` trigger order intent, not `rupaye|hazaar|rs` which are normal item rates).
- **Lines:** `voice.js:210-216`

### 2. Order branch triggered in `conversation.js`
- **Change:** `parsed.intent === 'order'` now triggers the order branch in `processTurn()`.
- **Import:** `detectOrderIntent` imported from `voice.js`, local duplicate removed.
- **Lines:** `conversation.js:1`, `conversation.js:489`

### 3. STT normalization variants added
- Added Hinglish STT variants to `normalizeDevanagari()`:
  - `panch` → `5`
  - `teen` → `3`
  - `char` → `4`
  - `gadiyan`/`gaadiyan` → `gaadi`
  - `se` (case-insensitive) → `se`
- **Lines:** `voice.js:521`

### 4. Tests passing
- **254/254 tests green** after the fix.
- Command used: `cd billing && npm test`

### 5. APK built and installed on device
- Build: `npm run build` → `npx cap sync android` → `cd android && ./gradlew.bat assembleDebug`
- Install: `adb install -r app\build\outputs\apk\debug\app-debug.apk`
- Device: `ZN52238XJ9` (connected via USB)

---

## 🔍 Device Log Findings (What Still Needs Work)

From the device console logs, the order flow is **partially broken**:

### What worked:
- First command `"58 rupaye kilo ke hisab se ek gadi teen trip maregi total 10 lakh ke Bil Bane Hain"` correctly returned `intent: order`.

### What broke:
1. **No session persistence across voice clicks** — After the first turn, each new "BOLO" click starts a fresh parse. The `pendingOrder` state in `conversation.js` is lost between voice inputs.
2. **Vehicle numbers not extracted in order context** — `"MP 20 ab 1234"` returned `clarify` instead of being captured as a vehicle number for the pending order.
3. **Stock query false positives** — Follow-up commands like `"is vehicle ki loading capacity Hai 1500 kg"` returned `stock_query` instead of continuing the order flow.
4. **Capacity/rate questions not routed through order branch** — `"1500"` and `"58 rupaye kilo"` were parsed as `clarify` instead of filling order fields.

### Root cause:
The `VoiceModal` component (`src/components/VoiceModal.jsx`) calls `parseVoice()` → `handle()` on every button click, but `conversation.current.processTurn()` is only called for non-bill intents. The order flow needs the same conversational persistence that the bill flow already has.

---

## 📋 What Needs To Be Done Next

### Priority 1: Order session persistence in VoiceModal
**File:** `src/components/VoiceModal.jsx`

The bill flow already does this correctly (lines 364-553):
```javascript
const turn = await conversation.current.processTurn(convoIdRef.current, text, parsed, bizCtx)
```

For order flow, we need similar handling:
- When `parsed.intent === 'order'` or `conversation.current.get(convoIdRef.current).order` exists, route through `processTurn()`.
- Handle `order_needs_info`, `order_confirm`, `order_execute` statuses from `processTurn()`.
- Show order draft UI similar to bill draft.

### Priority 2: Vehicle number extraction in order context
**File:** `src/lib/conversation.js` (around line 182-185)

`parseOrderFields` already extracts vehicle numbers via regex:
```javascript
const vehNos = [...String(text).matchAll(/([A-Za-z]{2}\s?\d{2}\s?[A-Za-z]{1,3}\s?\d{3,4})/gi)]
```

But the order branch condition at line 489 needs to ensure vehicle number inputs are captured even when they don't contain other order keywords.

### Priority 3: Capacity/rate follow-up in order flow
When order is pending and user says `"1500 kg"` or `"58 rupaye kilo"`, these should:
- Fill `vehicle.capacity` if vehicle is pending
- Fill `order.rate`/`order.unit` if order is pending

The regex patterns exist in `parseOrderFields` but the conversational routing needs to stay in order mode instead of falling through to `clarify`.

### Priority 4: Exit command for order mode
Add `"cancel"` / `"bas"` / `"mat banao"` handling for order flow, similar to bill flow (line 556-559).

---

## 🗂️ Key Files Changed

| File | Change |
|------|--------|
| `src/lib/voice.js` | `detectOrderIntent()` added; `hasAmount` → `hasLakh`; STT normalization variants |
| `src/lib/conversation.js` | Imported `detectOrderIntent`; order branch condition updated |
| `src/components/VoiceModal.jsx` | **Needs** order flow handling (same pattern as bill flow) |

---

## 🚀 How to Continue

1. Open `src/components/VoiceModal.jsx`
2. In the `handle()` function, after the bill flow block (line 364), add an order flow block:
   ```javascript
   if (parsed.intent === 'order' || (conversation.current.get(convoIdRef.current) && conversation.current.get(convoIdRef.current).order && !conversation.current.get(convoIdRef.current).order.executed)) {
     const bizCtx = { customers, stockItems, company, domain: resolveProfile(company), getHistory: (cid) => getCustomerHistory(cid), resolveCustomer: (name) => findCustomerByRef(customers, name) }
     const turn = await conversation.current.processTurn(convoIdRef.current, text, parsed, bizCtx)
     // Handle order_needs_info, order_confirm, order_execute similar to bill flow
   }
   ```
3. Add order draft UI in the JSX return section.
4. Build and test on device.

---

## 📊 Test Status

```bash
cd billing && npm test
# 254/254 passing ✔
```

---

*End of handoff.*
