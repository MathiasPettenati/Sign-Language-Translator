import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        app: "#f6f7f8",
        deep: {
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
          green: "#596873",
          amber: "#71808a",
          red: "#48545d",
          blue: "#48545d",
        },
      },
      boxShadow: {
        panel: "0 18px 60px rgba(17, 24, 39, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
