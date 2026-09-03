/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0c1117",
          raised: "#141b24",
          elevated: "#1c2530",
          hover: "#222d3a",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          hover: "rgba(255,255,255,0.12)",
        },
        accent: {
          DEFAULT: "#10b981", // emerald-500
          muted: "#059669", // emerald-600
          subtle: "rgba(16,185,129,0.12)",
        },
        danger: {
          DEFAULT: "#ef4444",
          muted: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
