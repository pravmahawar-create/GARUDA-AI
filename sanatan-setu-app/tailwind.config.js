/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sacred: {
          bg: "#07090E",
          surface: "#0D111A",
          card: "rgba(16, 21, 32, 0.85)",
          cardHover: "rgba(24, 32, 48, 0.95)",
          border: "rgba(212, 175, 55, 0.25)",
          borderGlow: "rgba(212, 175, 55, 0.6)",
        },
        gold: {
          50: "#FFFDF0",
          100: "#FFF9C4",
          200: "#FFF176",
          300: "#FFEE58",
          400: "#FFD54F",
          500: "#E6B450",
          600: "#D4AF37",
          700: "#C99700",
          800: "#997300",
          900: "#5C4500",
        },
        amber: {
          diya: "#FF8C00",
          glow: "#FFA500",
        }
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        devanagari: ['Noto Serif Devanagari', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'gold-sm': '0 0 10px rgba(212, 175, 55, 0.15)',
        'gold-md': '0 0 20px rgba(212, 175, 55, 0.25)',
        'gold-lg': '0 0 35px rgba(212, 175, 55, 0.4)',
        'diya': '0 0 25px rgba(255, 140, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
      }
    },
  },
  plugins: [],
}
