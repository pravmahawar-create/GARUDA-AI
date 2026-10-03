/**
 * 🦅 GARUDA OS — WAR ROOM DESIGN TOKENS
 * Strict Obsidian-Graphite Palette with Metallic Gold accents and authoritative typography.
 */

export const tokens = {
  palette: {
    // 🏛️ Official GARUDA War Room Sovereign Palette (Warm Ivory, Graphite & Luxury Gold)
    ivory: "#F7F3EA",
    ivorySoft: "#FBF9F4",
    white: "#FFFFFF",
    graphite: "#171717",
    deepGraphite: "#0F1110",
    gold: "#B8862B",
    goldLuxury: "#C99A3A",
    goldLight: "#E7C982",
    goldMuted: "#D8B66A",
    goldGradient: "linear-gradient(135deg, #E7C982 0%, #C99A3A 50%, #B8862B 100%)",
    goldHalo: "rgba(184, 134, 43, 0.12)",
    border: "#E6DCC8",
    borderSubtle: "rgba(23, 24, 27, 0.06)",
    borderGold: "rgba(184, 134, 43, 0.35)",
    mutedText: "#6F6A61",
    subtleText: "#8E887E",
    cardShadow: "0 8px 30px rgba(40, 30, 15, 0.06)",
    cardShadowSm: "0 2px 10px rgba(40, 30, 15, 0.04)",

    // Status Accents (Restrained)
    green: "#059669",
    greenLive: "#10B981",
    greenBg: "rgba(5, 150, 105, 0.08)",
    amber: "#D97706",
    amberBg: "rgba(217, 119, 6, 0.08)",
    red: "#DC2626",
    redBg: "rgba(220, 38, 38, 0.08)",
    cyan: "#0284C7",
    cyanBg: "rgba(2, 132, 199, 0.08)",

    // Backwards compatibility mappings
    obsidian: "#0F1110",
    surfaceElevated: "#FFFFFF",
    surfaceHighlight: "#FBF9F4",
    warmIvory: "#F7F3EA",
    metallicGold: "#C99A3A",
    textPrimary: "#171717",
    textSecondary: "#6F6A61",
    textMuted: "#8E887E",
    statusGreen: "#059669",
    statusGreenBg: "rgba(5, 150, 105, 0.12)",
    statusAmber: "#D97706",
    statusAmberBg: "rgba(217, 119, 6, 0.12)",
    statusRed: "#DC2626",
    statusRedBg: "rgba(220, 38, 38, 0.12)",
    statusGrey: "#686A70",
    statusGreyBg: "rgba(104, 106, 112, 0.12)"
  },
  typography: {
    fontDisplay: "'Playfair Display', Georgia, serif",
    fontUI: "'Inter', 'Manrope', system-ui, -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace"
  },
  classification: {
    FORTIFIED: {
      label: "FORTIFIED",
      color: "#059669",
      bg: "rgba(5, 150, 105, 0.12)",
      description: "Historical margin > 15% with stable or rising turnout baseline."
    },
    COMPETITIVE: {
      label: "COMPETITIVE",
      color: "#D97706",
      bg: "rgba(217, 119, 6, 0.12)",
      description: "Historical margin between 5% and 15% with high turnout elasticity."
    },
    VOLATILE: {
      label: "VOLATILE",
      color: "#DC2626",
      bg: "rgba(220, 38, 38, 0.12)",
      description: "Winning margin < 5% or declining turnout with significant 3rd-party vote splitting."
    },
    DATA_INSUFFICIENT: {
      label: "DATA INSUFFICIENT",
      color: "#686A70",
      bg: "rgba(104, 106, 112, 0.12)",
      description: "Fewer than 2 official ECI electoral cycles indexed or administrative boundary altered."
    }
  },
  dataStates: {
    VERIFIED: { label: "VERIFIED", color: "#059669", bg: "rgba(5, 150, 105, 0.12)" },
    CALCULATED: { label: "CALCULATED", color: "#0284C7", bg: "rgba(2, 132, 199, 0.12)" },
    ESTIMATED: { label: "ESTIMATED", color: "#8F6A2B", bg: "rgba(196, 139, 40, 0.12)" },
    SIMULATED: { label: "SIMULATION — NOT FORECAST", color: "#D97706", bg: "rgba(217, 119, 6, 0.12)" },
    PARTIAL: { label: "PARTIAL", color: "#EAB308", bg: "rgba(234, 179, 8, 0.12)" },
    UNKNOWN: { label: "UNKNOWN / DATA UNAVAILABLE", color: "#686A70", bg: "rgba(104, 106, 112, 0.12)" },
    NOT_CONNECTED: { label: "NOT CONNECTED", color: "#9CA3AF", bg: "rgba(156, 163, 175, 0.12)" }
  },
  freshnessThresholds: {
    LIVE: 60, // seconds
    FRESH: 900, // 15 minutes (in seconds)
    STALE: 86400, // 24 hours (in seconds)
    UNKNOWN: Infinity
  }
};

export function getFreshnessState(secondsAgo) {
  if (secondsAgo === null || secondsAgo === undefined) return { label: "UNKNOWN", color: "#686A70", bg: "rgba(104, 106, 112, 0.12)" };
  if (secondsAgo <= 60) return { label: "LIVE (<60s)", color: "#059669", bg: "rgba(5, 150, 105, 0.12)" };
  if (secondsAgo <= 900) return { label: "FRESH (<15m)", color: "#0284C7", bg: "rgba(2, 132, 199, 0.12)" };
  if (secondsAgo <= 86400) return { label: "STALE (<24h)", color: "#D97706", bg: "rgba(217, 119, 6, 0.12)" };
  return { label: "UNKNOWN / DISCONNECTED", color: "#686A70", bg: "rgba(104, 106, 112, 0.12)" };
}
