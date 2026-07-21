import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        app: "#f7f7f7",
        paper: "#f4f4f4",
        deep: {
          50: "#fafafa",
          100: "#f0f0f0",
          200: "#d9d9d9",
          300: "#bfbfbf",
          400: "#9a9a9a",
          500: "#737373",
          600: "#5c5c5c",
          700: "#474747",
          800: "#303030",
          900: "#222222",
          950: "#111111",
        },
        ink: {
          50: "#fafafa",
          100: "#f0f0f0",
          200: "#d9d9d9",
          300: "#bfbfbf",
          400: "#9a9a9a",
          500: "#737373",
          600: "#5c5c5c",
          700: "#474747",
          800: "#303030",
          900: "#222222",
          950: "#111111",
        },
      },
      boxShadow: {
        panel: "0 18px 60px rgba(17, 17, 17, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
