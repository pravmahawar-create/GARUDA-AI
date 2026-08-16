import React from "react";
import { GOLD } from "./format";

export default function Badge({ label, color = GOLD, title }) {
  return (
    <span
      title={title}
      style={{
        display: "inline-block",
        fontSize: "0.68rem",
        fontWeight: 800,
        letterSpacing: "0.08em",
        padding: "0.22rem 0.6rem",
        borderRadius: 999,
        border: `1px solid ${color}66`,
        color,
        background: `${color}14`,
        whiteSpace: "nowrap"
      }}
    >
      {label}
    </span>
  );
}