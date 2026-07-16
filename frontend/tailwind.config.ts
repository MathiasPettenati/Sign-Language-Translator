import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f8f8",
          100: "#edeff0",
          200: "#d8dddf",
          300: "#b7c0c5",
          400: "#8f9da5",
          500: "#71808a",
          600: "#596873",
          700: "#48545d",
          800: "#3f484f",
          900: "#22282d",
          950: "#111518",
        },
        signal: {
          green: "#1f9d6a",
          amber: "#c98509",
          red: "#c2413f",
          blue: "#2673c9",
        },
      },
      boxShadow: {
        panel: "0 18px 60px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;
