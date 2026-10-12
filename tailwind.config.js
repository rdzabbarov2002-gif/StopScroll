/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  // "class" lets the user override the system theme from inside the app.
  darkMode: "class",
  theme: {
    extend: {
      // An Apple-style system: white or black pages, soft grey cards, iOS system colors.
      colors: {
        // Accent: iOS system blue (600 in light, 500 in dark).
        brand: {
          50: "#EAF3FF",
          100: "#D6E8FF",
          200: "#ADD2FF",
          300: "#7DB8FF",
          400: "#409CFF",
          500: "#0A84FF",
          600: "#007AFF",
          700: "#0062CC",
          800: "#004A99",
          900: "#0B2A4A",
          950: "#071A30",
        },
        // Dark theme surfaces: page, card, nested fill, raised fill.
        ink: {
          600: "#636366",
          700: "#3A3A3C",
          800: "#2C2C2E",
          850: "#2C2C2E",
          900: "#1C1C1E",
          950: "#000000",
        },
        // Light theme: white page, grey cards.
        canvas: "#FFFFFF",
        card: "#F4F4F7",
        // iOS label greys.
        slate: {
          50: "#FFFFFF",
          100: "#F2F2F7",
          200: "#E5E5EA",
          300: "#D1D1D6",
          400: "#8E8E93",
          500: "#6C6C70",
          600: "#48484A",
          700: "#3A3A3C",
          800: "#1C1C1E",
          900: "#000000",
        },
        // iOS green.
        emerald: {
          50: "#EBF9EF",
          100: "#DDF4E4",
          300: "#7BE495",
          400: "#30D158",
          500: "#34C759",
          600: "#248A3D",
          700: "#1E7A34",
          950: "#0B2614",
        },
        // iOS orange.
        amber: {
          50: "#FFF4EA",
          100: "#FFE6D2",
          300: "#FFB066",
          400: "#FF9F0A",
          500: "#FF9500",
          600: "#F25C05",
          700: "#C93400",
          900: "#4A2100",
          950: "#2E1500",
        },
        // iOS red.
        rose: {
          50: "#FFEDEC",
          100: "#FFDAD8",
          400: "#FF453A",
          500: "#FF3B30",
          600: "#D70015",
          950: "#3A0A08",
        },
      },
      borderRadius: {
        "4xl": "2rem",
        card: "26px",
      },
    },
  },
  plugins: [],
};
