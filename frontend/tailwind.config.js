/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#09090b", // zinc-950
          900: "#18181b", // zinc-900
          800: "#27272a", // zinc-800
          700: "#3f3f46", // zinc-700
        },
        accent: {
          DEFAULT: "#0284c7", // sky-600 (Electric blue)
          muted: "#0369a1", // sky-700
        },
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
