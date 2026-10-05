const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('frontend/src/pages/ConstituencyWarRoom.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add wp (War Room Palette) right after INITIAL_THANE if not present
const paletteDef = `
// 🏛️ GARUDA OS Sovereign Palette (100% Aligned with garudaos.in Home Page)
const wp = {
  // Foundation Canvas (Warm premium ivory / atmospheric off-white)
  canvas: "#F6F4EE",
  canvasIvory: "#FAF9F6",
  canvasSubtle: "#F2EFE8",
  card: "#FFFFFF",

  // Text Hierarchy (Rich obsidian graphite, not flat black)
  text: "#17181B",
  textBody: "#292B30",
  muted: "#525866",
  subtle: "#8A8D95",

  // Signature GARUDA Gold (Metalic, warm, prestigious)
  gold: "#B38235",
  goldPrimary: "#C48B28",
  goldDeep: "#9E6D1C",
  goldLight: "#D6A84F",
  goldGradient: "linear-gradient(135deg, #C48B28 0%, #9E6D1C 100%)",
  goldHalo: "rgba(179, 130, 53, 0.12)",

  // Status Accents
  green: "#059669",
  greenBg: "rgba(5, 150, 105, 0.08)",
  red: "#DC2626",
  redBg: "rgba(220, 38, 38, 0.08)",
  amber: "#D97706",
  amberBg: "rgba(217, 119, 6, 0.08)",
  cyan: "#0284C7",
  cyanBg: "rgba(2, 132, 199, 0.08)",

  // Borders & Shadows
  border: "rgba(23, 24, 27, 0.08)",
  borderSubtle: "rgba(23, 24, 27, 0.05)",
  borderGold: "rgba(179, 130, 53, 0.35)",
  shadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
};
`;

if (!content.includes('const wp = {')) {
  content = content.replace('const INITIAL_THANE = {', paletteDef + '\nconst INITIAL_THANE = {');
}

// 2. Replace Root Background and Colors
content = content.replace('backgroundColor: "#080A0F"', 'backgroundColor: wp.canvas');
content = content.replace('color: "#F5F5F2"', 'color: wp.text');

// 3. Replace Sidebar Background & Borders
content = content.replace('backgroundColor: "#0B0E14"', 'backgroundColor: wp.canvasIvory');
content = content.replace('borderRight: "1px solid rgba(255, 255, 255, 0.06)"', 'borderRight: "1px solid " + wp.border');

// 4. Sidebar Logo Box
content = content.replace(
  'background: "linear-gradient(135deg, rgba(229, 169, 60, 0.2) 0%, rgba(120, 73, 11, 0.4) 100%)"',
  'background: wp.goldHalo'
);
content = content.replace('border: "1px solid rgba(229, 169, 60, 0.4)"', 'border: "1px solid " + wp.borderGold');
content = content.replace('color: "#E5A93C"', 'color: wp.goldPrimary');
content = content.replace('color: "#8F6A2B"', 'color: wp.goldDeep');

// 5. Sidebar Navigation Items
content = content.replace('stroke={active ? "#E5A93C" : "#9CA3AF"}', 'stroke={active ? wp.goldPrimary : wp.muted}');
content = content.replace('background: isActive ? "rgba(196, 139, 40, 0.12)" : "transparent"', 'background: isActive ? "rgba(196, 139, 40, 0.1)" : "transparent"');
content = content.replace('border: isActive ? "1px solid rgba(196, 139, 40, 0.3)" : "1px solid transparent"', 'border: isActive ? "1px solid " + wp.borderGold : "1px solid transparent"');
content = content.replace('color: isActive ? "#E5A93C" : "#F3F4F6"', 'color: isActive ? wp.goldPrimary : wp.text');
content = content.replace('color: "#6B7280"', 'color: wp.subtle');

// 6. Sidebar Exclusivity Card
content = content.replace(
  'background: "linear-gradient(135deg, rgba(196, 139, 40, 0.15) 0%, rgba(12, 14, 18, 0.9) 100%)"',
  'background: "linear-gradient(135deg, rgba(196, 139, 40, 0.08) 0%, #FFFFFF 100%)", boxShadow: wp.shadow'
);
content = content.replace('border: "1px solid rgba(196, 139, 40, 0.4)"', 'border: "1px solid " + wp.borderGold');
content = content.replace('background: "rgba(196, 139, 40, 0.2)"', 'background: wp.goldHalo');
content = content.replace('color: "#D1D5DB"', 'color: wp.textBody');

// 7. Topbar Background & Dropdowns
content = content.replace('backgroundColor: "#0B0E14"', 'backgroundColor: "rgba(250, 249, 246, 0.94)", backdropFilter: "blur(12px)"');
content = content.replace('borderBottom: "1px solid rgba(255, 255, 255, 0.06)"', 'borderBottom: "1px solid " + wp.border');
content = content.replace('background: "rgba(255, 255, 255, 0.03)"', 'background: "#FFFFFF", boxShadow: wp.shadow');
content = content.replace('border: "1px solid rgba(255, 255, 255, 0.08)"', 'border: "1px solid " + wp.border');
content = content.replace('color: "#FFFFFF"', 'color: wp.text');
content = content.replace('color: "#6B7280"', 'color: wp.muted');

// 8. Search Input
content = content.replace('background: "rgba(255, 255, 255, 0.04)"', 'background: "#FFFFFF"');
content = content.replace('color: "#F3F4F6"', 'color: wp.text');
content = content.replace('background: "rgba(255, 255, 255, 0.08)"', 'background: wp.canvasSubtle');

// 9. Mode Switcher
content = content.replace('background: isSelected ? "linear-gradient(135deg, #E5A93C 0%, #C48B28 100%)" : "transparent"', 'background: isSelected ? wp.goldGradient : "transparent"');
content = content.replace('color: isSelected ? "#080A0F" : "#9CA3AF"', 'color: isSelected ? "#FFFFFF" : wp.muted');

// 10. User Profile
content = content.replace('background: "#1F2937"', 'background: wp.goldHalo');
content = content.replace('border: "1px solid rgba(255, 255, 255, 0.15)"', 'border: "1px solid " + wp.borderGold');
content = content.replace('color: "#F5F5F2"', 'color: wp.goldDeep');
content = content.replace('borderLeft: "1px solid rgba(255, 255, 255, 0.08)"', 'borderLeft: "1px solid " + wp.border');

// 11. Header Title & Button
content = content.replace('color: "#FFFFFF", margin: 0', 'color: wp.text, margin: 0');
content = content.replace('color: "#9CA3AF", margin: "2px 0 0 0"', 'color: wp.muted, margin: "2px 0 0 0"');
content = content.replace('color: "#E5E7EB"', 'color: wp.textBody');
content = content.replace('background: "linear-gradient(135deg, #F3BA2F 0%, #C48B28 100%)"', 'background: wp.goldGradient');
content = content.replace('color: "#080A0F"', 'color: "#FFFFFF"');
content = content.replace('boxShadow: "0 4px 14px rgba(196, 139, 40, 0.3)"', 'boxShadow: "0 4px 14px rgba(196, 139, 40, 0.25)"');

// 12. Replace all card containers
// Replace #10141D with wp.card (#FFFFFF) and add wp.shadow
content = content.replaceAll('background: "#10141D"', 'background: wp.card, boxShadow: wp.shadow');
content = content.replaceAll('border: "1px solid rgba(255, 255, 255, 0.06)"', 'border: "1px solid " + wp.border');
content = content.replaceAll('border: "1px solid rgba(255, 255, 255, 0.04)"', 'border: "1px solid " + wp.borderSubtle');
content = content.replaceAll('color: "#FFFFFF"', 'color: wp.text');
content = content.replaceAll('color: "#9CA3AF"', 'color: wp.muted');

// 13. Map visual interior
content = content.replace('background: "#080B10"', 'background: wp.canvasIvory');
content = content.replace('background: "rgba(11, 14, 20, 0.88)"', 'background: "rgba(255, 255, 255, 0.94)"');
content = content.replace('stroke: "rgba(196, 139, 40, 0.45)"', 'stroke: wp.goldPrimary');
content = content.replace('fill="rgba(14, 165, 233, 0.03)"', 'fill="rgba(196, 139, 40, 0.04)"');
content = content.replace('fill="#FFFFFF" fontSize="13.5"', 'fill="#17181B" fontSize="13.5"');
content = content.replace('stroke="rgba(255,255,255,0.06)"', 'stroke="rgba(23, 24, 27, 0.08)"');
content = content.replace('stroke="#38BDF8"', 'stroke="rgba(23, 24, 27, 0.05)"');

// 14. Feed Items & Quick Actions
content = content.replaceAll('background: "rgba(255, 255, 255, 0.02)"', 'background: wp.canvasSubtle');
content = content.replaceAll('background: "rgba(255, 255, 255, 0.03)"', 'background: wp.canvasSubtle');
content = content.replaceAll('color: "#D1D5DB"', 'color: wp.textBody');
content = content.replaceAll('color: "#E5E7EB"', 'color: wp.textBody');

// Write back
fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully transformed ConstituencyWarRoom.jsx to garudaos.in home page style!');
