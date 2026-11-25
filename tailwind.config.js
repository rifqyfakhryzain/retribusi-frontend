/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        // Semantic aliases for institutional theme
        brand: {
          950: "#022c22", // emerald-950
          900: "#064e3b",
          800: "#065f46",
          700: "#047857", // emerald-700 primary
          600: "#059669",
          500: "#10b981",
          200: "#a7f3d0",
          100: "#d1fae5",
          50: "#ecfdf5",
        },
      },
      keyframes: {
        rowHighlight: {
          "0%": { backgroundColor: "#ecfdf5" }, // emerald-50
          "100%": { backgroundColor: "transparent" },
        },
        scan: {
          "0%": { top: "6%", opacity: "0" },
          "15%": { opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { top: "92%", opacity: "0" },
        },
      },
      animation: {
        rowHighlight: "rowHighlight 1.5s ease-out forwards",
        scan: "scan 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
