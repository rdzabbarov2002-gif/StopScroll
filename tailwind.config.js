/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  // "class" lets the user override the system theme from inside the app.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand: calm indigo — "focus" instead of the red/pink of feed apps.
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          950: "#1E1B4B",
        },
        // Deep navy surfaces for the dark theme.
        ink: {
          700: "#2A3650",
          800: "#1B2438",
          850: "#151D2E",
          900: "#111827",
          950: "#0B1120",
        },
        // Clean light surfaces.
        canvas: "#F5F7FA",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
