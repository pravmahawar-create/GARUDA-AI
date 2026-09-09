/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        garudaGold: "#f5d76e",
        garudaAmber: "#d4af37",
        garudaDark: "#030712",
        garudaCard: "#0b0f17"
      },
    },
  },
  plugins: [],
};
