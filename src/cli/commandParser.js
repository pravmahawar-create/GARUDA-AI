function parseCommand(input) {
  const trimmed = input.trim();
  if (!trimmed) return { command: "empty", args: [], raw: "" };

  const lower = trimmed.toLowerCase();

  if (lower === "help" || lower === "?") return { command: "help", args: [], raw: trimmed };
  if (lower === "status" || lower === "kya haal hai") return { command: "status", args: [], raw: trimmed };
  if (lower === "health" || lower === "sehat") return { command: "health", args: [], raw: trimmed };
  if (lower === "capabilities" || lower === "kya kar sakta hai") return { command: "capabilities", args: [], raw: trimmed };
  if (lower === "memory" || lower === "yaad") return { command: "memory", args: [], raw: trimmed };
  if (lower.startsWith("review ") || lower.startsWith("check ")) {
    return { command: "review", args: [trimmed.split(/\s+/).slice(1).join(" ")], raw: trimmed };
  }
  if (lower.startsWith("plan ") || lower.startsWith("soch ")) {
    return { command: "plan", args: [trimmed.split(/\s+/).slice(1).join(" ")], raw: trimmed };
  }
  if (lower.startsWith("fix ") || lower.startsWith("sudhar ")) {
    return { command: "fix", args: [trimmed.split(/\s+/).slice(1).join(" ")], raw: trimmed };
  }
  if (lower.startsWith("find ") || lower.startsWith("dhundh ")) {
    return { command: "find", args: [trimmed.split(/\s+/).slice(1).join(" ")], raw: trimmed };
  }
  if (lower.startsWith("explain ") || lower.startsWith("samjha ")) {
    return { command: "explain", args: [trimmed.split(/\s+/).slice(1).join(" ")], raw: trimmed };
  }
  if (lower.startsWith("generate ") || lower.startsWith("bana ")) {
    return { command: "generate", args: [trimmed.split(/\s+/).slice(1).join(" ")], raw: trimmed };
  }
  if (lower.startsWith("remember ") || lower.startsWith("yaad ")) {
    return { command: "remember", args: [trimmed.split(/\s+/).slice(1).join(" ")], raw: trimmed };
  }
  if (lower.startsWith("learn ") || lower.startsWith("seekh ")) {
    return { command: "learn", args: [trimmed.split(/\s+/).slice(1).join(" ")], raw: trimmed };
  }
  if (lower === "goals" || lower === "missions") return { command: "goals", args: [], raw: trimmed };
  if (lower === "quit" || lower === "exit" || lower === "band") return { command: "quit", args: [], raw: trimmed };

  return { command: "chat", args: [trimmed], raw: trimmed };
}

module.exports = { parseCommand };
