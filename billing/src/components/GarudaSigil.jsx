import React from 'react'

export default function GarudaSigil({ size = 40, className = '' }) {
  return (
    <img
      src="/assets/garuda/sigil.png"
      width={size}
      height={size}
      alt="GARUDA SIGIL"
      className={className}
      aria-label="GARUDA"
    />
  )
}