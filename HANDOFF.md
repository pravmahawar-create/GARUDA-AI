# GARUDA Billing — Handoff for 2026-08-24

## Today's Accomplishments (2026-08-23)

### Stock Voice Consistency Fix
- **Root cause identified**: Order-sensitive `normalizeName()` in `src/db.js` caused `"ACC Cement"` and `"Cement - ACC"` to resolve as different products. Voice operations targeted the wrong record while the Stock UI displayed another.
- **Fixes applied**:
  - `src/db.js`: `normalizeName` now sorts words alphabetically before joining. `"ACC Cement"` and `"Cement - ACC"` both normalize to `acccement`.
  - `src/lib/voice.js`: Added `mines`, `mine`, `kam`, `ghata do`, `hata do` to stock hint/subtract regexes; fixed `buildItemName` to strip all trailing stop words; added pre-qty fallback in `parseStock`; added `clarify` for mutation commands missing item name.
  - `src/components/VoiceModal.jsx`: Fixed duplicate success message display by excluding stock/bill intents from the generic message render block.
- **Regression tests added**: 11 new tests covering alias resolution, voice/UI record identity, add/subtract/query consistency, insufficient-stock floor, unrelated product isolation, and bill stock deduction.
- **Test results**: 100/100 passing (was 89/89 before new tests).
- **Build & device**: APK built and installed on ZN52238XJ9 (versionCode=12, versionName=1.11). App data preserved.

### Voice Billing Lifecycle Stabilization (previous session)
- Checkpointed in commits `165bc05` and `ad8e8b8`.
- Fixed voice modal cleanup, listener leaks, and bill summary rendering across consecutive sessions.

## Current Repository State

### Billing Repo (`billing/`)
- Branch: `main` (ahead of origin by 2 commits — not yet pushed)
- Modified source files:
  - `src/db.js`
  - `src/lib/voice.js`
  - `src/lib/voice.test.js`
  - `src/lib/voiceExecutor.js`
  - `src/lib/voiceExecutor.test.js`
  - `src/components/VoiceModal.jsx`
  - `src/screens/StockScreen.jsx`
  - `vite.config.js`
  - `index.html`
- Untracked: Android project files, `dist/`, `capacitor.config.json`, APK artifacts.
- **Note**: `dist/` and build artifacts are present. Do not commit these; they are in `.gitignore` but some were force-overwritten during today's build cycle.

### Parent Repo (`GARUDA-AI/`)
- Modified: `package.json`, `package-lock.json`, and several files in `src/models/` and `src/routes/`.
- These changes appear to be from an earlier parallel work track (Mongo/billing backend models). **Do not mix** with the mobile billing work unless explicitly asked.

## What Remains / Next Steps

### 1. Push billing commits
```bash
cd billing
git add src/db.js src/lib/voice.js src/lib/voice.test.js src/lib/voiceExecutor.js src/lib/voiceExecutor.test.js src/components/VoiceModal.jsx src/screens/StockScreen.jsx
git commit -m "fix: stock voice consistency — canonical identity, subtract, duplicate message"
git push origin main
```

### 2. Clean up untracked build artifacts
The `dist/` rebuild and Android sync left stale hashes and untracked files:
```bash
cd billing
git clean -fd dist/ android/ capacitor.config.json Garuda-Billing.apk
```
Then rebuild cleanly if needed:
```bash
npm run build && npx cap sync android
```

### 3. Verify parent repo changes
The parent `GARUDA-AI/` repo has uncommitted changes to `src/models/` and `src/routes/`. These may be from an incomplete feature branch. Before touching them:
- Check if they are needed for the mobile billing backend sync.
- If not needed, stash or revert to avoid conflating the mobile PWA work with the Node/Express backend.

### 4. Real-device validation checklist (device ZN52238XJ9)
The APK is installed but manual voice testing should be repeated to confirm:
- [ ] Stock screen shows correct quantities for all items.
- [ ] Voice add updates the **same** record visible on the Stock screen.
- [ ] Voice subtract actually deducts quantity and reports the correct resulting number.
- [ ] Voice query returns the same quantity as the Stock screen.
- [ ] Aliases like `"Cement - ACC"` and `"ACC cement"` resolve to the same record as `"ACC Cement"`.
- [ ] Success message appears **once** per stock operation.
- [ ] Consecutive voice commands do not leak state between sessions.

### 5. Known limitations / watch-outs
- **Duplicate records**: If the device already has both `ACC Cement` and `Cement - ACC` with different quantities, the new normalization will treat them as the same product going forward, but existing stale `qty` values on the "loser" record will not auto-merge. If quantities disagree, the shortest-name record wins `findStockItem` lookups, but the other record still exists in `db.items`. Consider a one-time migration script if data drift is suspected.
- **Stock UI still shows `it.qty`**: `StockScreen.jsx` renders `it.qty` directly. For full consistency, consider migrating the Stock UI to use `getPhysicalStock(item.id)` everywhere, matching the voice path. This is a follow-up refactor, not a blocker.
- **VoiceModal duplicate logic**: The fix is a render guard. If future intents are added that also use `message`, they must be added to the exclusion list or given their own render block.

## How to Resume Tomorrow

1. `cd C:\Users\hp\OneDrive\GARUDA\GARUDA-AI\billing`
2. Review `git status` and ensure only intended source files are modified.
3. Run `npm test` (expect 100/100).
4. Run `npm run build && npx cap sync android` if a fresh APK is needed.
5. Address parent repo changes if they block backend sync.

## Key File References
- Canonical identity fix: `src/db.js:289-304`
- Parser robustness: `src/lib/voice.js:40-56, 148-192`
- Duplicate message fix: `src/components/VoiceModal.jsx:492`
- Regression tests: `src/lib/voice.test.js:288-320`, `src/lib/voiceExecutor.test.js:194-268`
- Device: ZN52238XJ9 | APK: `Garuda-Billing.apk` (debug)

---
*Handoff generated 2026-08-23 21:25 IST*
