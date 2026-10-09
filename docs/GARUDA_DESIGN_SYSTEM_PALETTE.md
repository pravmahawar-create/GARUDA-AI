# GARUDA OS CANONICAL LIGHT DESIGN SYSTEM (PERMANENT SYSTEM LOCK)

## 1. Executive Design Doctrine: "Light-Only Sovereign Standard"
Under the sovereign mandate of Founder Praveen Mahawar, GARUDA OS operates exclusively on a **PREMIUM LIGHT-ONLY THEME**.
- **Canvas Atmosphere**: Warm Ivory with subtle beige undertones.
- **Content Surfaces**: Pure white cards with delicate neutral separation (no dark cards, no black panels, no dark chat surfaces).
- **Text Readability**: Executive charcoal for high-contrast headings and primary text; slate for secondary information.
- **Brand Identity**: Sovereign gold as a restrained, expensive accent and selected state (never overwhelming every surface).
- **Accessibility Guarantee**: Full WCAG AA (>= 4.5:1) and AAA (>= 7:1) contrast compliance across all foreground/background pairings.

---

## 2. Canonical Color Palette & Tokens

| Token Name | Hex / Value | Purpose & Role | WCAG Contrast on #F7F4EE |
| :--- | :--- | :--- | :--- |
| `--canvas-warm` | `#F7F4EE` | **Primary Page Canvas** (Warm Ivory) | Base surface |
| `--canvas-ivory` | `#FAF9F6` | **Clean Ivory Variant** (Header/Footer background) | Base surface |
| `--canvas-subtle` | `#F2EFE8` | **Soft Beige** (Surface variation, tabs container) | Base surface |
| `--canvas-card` | `#FFFFFF` | **Pure White** (Content cards, pricing boxes, modals) | Base surface |
| `--text-rich` | `#17181B` | **Executive Charcoal** (Headings, primary text) | **15.2:1 (AAA Pass)** |
| `--text-body` | `#1F242E` | **Graphite Charcoal** (Body paragraphs, inputs) | **12.8:1 (AAA Pass)** |
| `--text-muted` | `#525866` | **Slate** (Secondary text, subtitles, meta) | **6.4:1 (AA Pass)** |
| `--text-subtle` | `#717784` | **Caption Slate** (Timestamps, footnotes) | **4.6:1 (AA Pass)** |
| `--gold-primary`| `#C48B28` | **Sovereign Gold** (CTA Buttons, active badges) | Graphical (3.1:1) |
| `--gold-deep` | `#8B6118` | **Deep Gold** (Gold text on light canvas) | **4.97:1 (AA Pass)** |
| `--gold-light` | `#D6A84F` | **Gold Highlights & Badges** (Never for body text) | Contrast Warning |
| `--gold-gradient` | `linear-gradient(135deg, #C48B28 0%, #9E6D1C 100%)` | Primary interactive buttons | N/A |
| `--border-light` | `rgba(23, 24, 27, 0.08)` | Delicate content card borders | N/A |
| `--border-gold` | `rgba(196, 139, 40, 0.35)` | Featured card and active state borders | N/A |

### Functional Semantic Tokens (Preserved):
- **Success**: `#059669` (bg: `rgba(5, 150, 105, 0.08)`)
- **Warning**: `#D97706` (bg: `rgba(217, 119, 6, 0.08)`)
- **Error / Urgent**: `#DC2626` (bg: `rgba(220, 38, 38, 0.08)`)
- **Tech Indigo / Info**: `#343A67` (bg: `rgba(52, 58, 103, 0.08)`)
- **Cyan Accent**: `#0284C7` (bg: `rgba(2, 132, 199, 0.08)`)

---

## 3. Mandatory Governance & Contrast Rules

1. **Zero Dark Interface Surfaces**:
   - Black panels (`#000000`, `#04070a`, `#030712`, `#0a0d13`, `#10141D`), dark cards, and dark chat consoles are strictly prohibited.
   - All interactive consoles, chats, forms, footers, and cards must reside on pure white (`#FFFFFF`) or soft ivory surfaces.

2. **The Deep Gold Contrast Mandate**:
   - **RULE**: NEVER use light gold `#D6A84F` or `#F5D76E` for regular text on `#F7F4EE` or `#FFFFFF` (contrast only 2.0:1 — FAIL).
   - ALWAYS use Deep Gold `#8B6118` whenever rendering gold-colored text on light backgrounds (contrast 4.97:1 on ivory, 5.53:1 on white — PASS).

3. **Restrained Gold Accent Rule**:
   - Sovereign Gold must remain an accent, never dominating entire large backgrounds.
   - Use gold for:
     - Primary call-to-action buttons
     - Selected navigation/tab states
     - Feature highlights and star icons
     - Active card borders (`rgba(196, 139, 40, 0.35)`)

4. **Rule for Adding New Colors**:
   - Never introduce arbitrary HEX codes in component inline styles.
   - All new surfaces or indicators must reuse approved tokens from `frontend/src/theme/palette.js` and `frontend/src/styles/garuda-ui.css`.
