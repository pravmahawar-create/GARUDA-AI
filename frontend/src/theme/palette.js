/**
 * GARUDA OS CANONICAL LIGHT-ONLY DESIGN SYSTEM PALETTE
 * Permanent Design System Lock (Founder Praveen Mahawar Mandate)
 * 
 * Strict WCAG AA / AAA Accessible Contrast Ratios:
 * - Executive Charcoal (#17181B) on Warm Ivory (#F7F4EE): 15.2:1 (AAA)
 * - Slate (#525866) on Warm Ivory (#F7F4EE): 6.4:1 (AA)
 * - Deep Gold (#8B6118) on Warm Ivory (#F7F4EE): 4.97:1 (AA >= 4.5:1)
 * - Executive Charcoal (#17181B) on Pure White (#FFFFFF): 16.9:1 (AAA)
 * - Slate (#525866) on Pure White (#FFFFFF): 7.1:1 (AAA)
 * - Deep Gold (#8B6118) on Pure White (#FFFFFF): 5.53:1 (AA)
 */

export const PALETTE = {
  // 1. Page Canvas & Neutral Surfaces
  canvas: "#F7F4EE",          // Primary Page Canvas (Warm Ivory)
  canvasIvory: "#FAF9F6",     // Clean Ivory Variant
  canvasSubtle: "#F2EFE8",    // Soft Beige / Subtle Surface Separation
  card: "#FFFFFF",            // Pure White Content Cards & Surfaces
  elevated: "#FFFFFF",        // Elevated Surfaces, Modals, Drawers

  // 2. Text Hierarchy (Executive Charcoal & Slate)
  text: "#17181B",            // Executive Charcoal (Headings & Primary Text)
  textBody: "#1F242E",        // Charcoal Body Text
  muted: "#525866",           // Slate Secondary Text
  subtle: "#717784",          // Caption & Subtle Supporting Text

  // 3. Sovereign Gold Accent Hierarchy
  gold: "#B38235",            // Sovereign Gold Accent
  goldPrimary: "#C48B28",     // Primary Sovereign Gold (CTA Buttons, Active States)
  goldDeep: "#8B6118",        // Deep Gold (Accessible Text on Light Canvas, >= 4.5:1 WCAG)
  goldLight: "#D6A84F",       // Gold Highlights & Badges (Never used for normal body text on light canvas)
  goldGradient: "linear-gradient(135deg, #C48B28 0%, #9E6D1C 100%)",
  goldGradientHover: "linear-gradient(135deg, #D6A84F 0%, #B38235 100%)",
  goldHalo: "rgba(196, 139, 40, 0.10)",
  goldTint: "rgba(196, 139, 40, 0.06)",

  // 4. Semantic Indicators (Preserved)
  green: "#059669",
  greenBg: "rgba(5, 150, 105, 0.08)",
  red: "#DC2626",
  redBg: "rgba(220, 38, 38, 0.08)",
  amber: "#D97706",
  amberBg: "rgba(217, 119, 6, 0.08)",
  indigo: "#343A67",
  indigoBg: "rgba(52, 58, 103, 0.08)",
  cyan: "#0284C7",
  cyanBg: "rgba(2, 132, 199, 0.08)",

  // 5. Borders & Divider Lines
  border: "rgba(23, 24, 27, 0.08)",
  borderSubtle: "rgba(23, 24, 27, 0.05)",
  borderGold: "rgba(196, 139, 40, 0.35)",
  borderHover: "rgba(23, 24, 27, 0.16)",

  // 6. Premium Elevation Shadows
  shadowSm: "0 2px 8px rgba(0, 0, 0, 0.03)",
  shadowMd: "0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
  shadowLg: "0 20px 48px -8px rgba(23, 24, 27, 0.06), 0 4px 12px rgba(0, 0, 0, 0.02)",
  shadowGold: "0 4px 15px rgba(179, 130, 53, 0.28)"
};

export default PALETTE;
