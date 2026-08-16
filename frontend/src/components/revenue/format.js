export const GOLD = "#d4af37";
export const MUTED = "#8b94a6";
export const GREEN = "#75f4ab";
export const AMBER = "#f5d76e";
export const RED = "#f87171";
export const BLUE = "#7dd3fc";
export const PURPLE = "#c4b5fd";

export function formatAmount(amount, currency) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: String(currency || "INR"),
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  } catch {
    return `${currency || "INR"} ${Number(amount || 0).toFixed(2)}`;
  }
}

export function formatNumber(value) {
  try {
    return new Intl.NumberFormat("en-IN").format(Number(value || 0));
  } catch {
    return String(value ?? 0);
  }
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function titleCase(value = "") {
  return String(value)
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function toneFor(value = "", map = {}) {
  return map[String(value).toLowerCase()] || MUTED;
}