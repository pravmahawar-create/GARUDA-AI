# Voice Command Center — Improvement TODO

## Core Problem
Current voice system feels like a **dumb bot** — it does exact keyword matching, breaks on natural Hindi/English mix, and has no memory of real conversation flow. It should feel like talking to a **smart shop assistant** who remembers everything.

---

## 1. CONVERSATION MEMORY & CONTEXT (HIGH PRIORITY)
- [ ] Add **persistent conversation session** per company (not just per bill)
- [ ] Remember last 5-10 turns: customer mentioned, items discussed, amounts quoted
- [ ] Support pronouns: *"usko 50 bag dena"* → refers to last mentioned customer
- [ ] Support ellipsis: *"aur 2 ton sariya"* → continues current bill/order
- [ ] Context should survive app backgrounding (save to IndexedDB)

## 2. NATURAL LANGUAGE UNDERSTANDING (HIGH PRIORITY)
- [ ] Move beyond regex-based `parseVoice()` — integrate **Gemini API** as primary NLU layer
- [ ] Gemini should receive: active company profile, recent customer list, stock catalogue, last 3 conversation turns
- [ ] Extract structured intent + entities + sentiment from free-form Hindi/English/Hinglish
- [ ] Fallback to regex only when AI fails or is offline

## 3. FRIENDLY VOICE PERSONALITY (HIGH PRIORITY)
- [ ] Add **personality layer** — responses should feel human:
  - Acknowledge before acting: *"Theek hai Vijay Singh ka bill bana raha hoon..."*
  - Confirm quantities with gentle clarification, not robotic error
  - Use regional Hindi warmth (Hinglish mix acceptable)
  - Remember user's preferred language per company
- [ ] Replace all *"Error: Invalid stock entry"* type messages with human alternatives

## 4. SMART ENTITY RESOLUTION (MEDIUM PRIORITY)
- [ ] **Customer resolution**: fuzzy match + recent-customer bias + phone number parsing
- [ ] **Item resolution**: understand brand synonyms, sizes, units automatically
  - *"ACC wali cement"* → ACC Cement
  - *"8mm ka sariya"* → TMT Steel 8mm
- [ ] **Vehicle resolution**: understand *"MP ka wahan wala number"* → MP20AB1234
- [ ] Never ask for information already known from context

## 5. PROACTIVE ASSISTANCE (MEDIUM PRIORITY)
- [ ] Stock alerts during order: *"Aapke paas 200 bag cement hai, order 500 ka hai — aur chahiye?"*
- [ ] Rate suggestions: *"Pehle 380 tha, ab 390 lag raha hai — confirm karo?"*
- [ ] Delivery suggestions based on vehicle capacity and order quantity
- [ ] Payment reminders: *"Vijay Singh ka 12000 pending hai, isme include karu?"*

## 6. MULTI-TURN ORDER FLOW (MEDIUM PRIORITY)
- [ ] Order conversation should feel like WhatsApp chat, not form filling
- [ ] Show order draft as **chat bubbles** — user sees what was captured
- [ ] Allow editing: *"nai, 7 tarikh se 9 tarikh kar do"*
- [ ] Allow cancellation: *"cancel kar do"*
- [ ] Support partial confirmation: *"customer change kar do"*

## 7. VOICE ERROR RECOVERY (MEDIUM PRIORITY)
- [ ] When STT fails or is unclear, say: *"Thoda aawaz clear nahi aayi, phir bolo"*
- [ ] When intent is ambiguous, offer 2-3 options conversationally
- [ ] Never silently ignore — always respond

## 8. PER-COMPANY VOICE PROFILES (LOW PRIORITY)
- [ ] Each company can have:
  - Preferred greeting style
  - Default language (Hindi/English/Hinglish)
  - Custom aliases for frequently used items
  - Default rate memory (auto-suggest last used rate)

## 9. OFFLINE INTELLIGENCE (LOW PRIORITY)
- [ ] Current regex parser should be enhanced even without internet
- [ ] Add **bigram/trigram** understanding for common phrases
- [ ] Cache recent successful commands per company for pattern matching

## 10. VOICE UI REDESIGN (LOW PRIORITY)
- [ ] Replace current voice modal with **chat-style interface**
- [ ] Show conversation history as chat bubbles
- [ ] Add quick-reply chips for common responses
- [ ] Show "listening..." animation that feels natural

---

## Implementation Order
1. Gemini-first NLU with conversation context (replaces regex brain)
2. Personality layer (response templates + tone)
3. Smart entity resolution (customers, items, vehicles)
4. Multi-turn order flow with draft editing
5. Proactive assistance (stock checks, rate suggestions)
6. Voice UI redesign (chat interface)
7. Offline enhancements
8. Per-company profiles

---

## Files to Modify
- `src/lib/voice.js` — regex parser → AI-first parser
- `src/lib/conversation.js` — add session memory, context-aware responses
- `src/components/VoiceModal.jsx` — chat UI redesign
- `src/lib/domainProfiles.js` — add voice personality per domain
- `src/lib/voiceExecutor.js` — smarter execution with confirmation
- New: `src/lib/voicePersonality.js` — response generation layer
- New: `src/lib/conversationMemory.js` — session + entity memory

---

## Notes
- Keep existing regex as **fallback** when AI is unavailable
- Do NOT break current working order detection
- Company isolation already done — voice must respect it
- Test on real device with actual shop noise
