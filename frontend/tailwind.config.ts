import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        app: "#f3fbff",
        deep: {
          50: "#eef8ff",
          100: "#d8efff",
          200: "#b9e1ff",
          300: "#89ccf6",
          400: "#52addf",
          500: "#2f8fc6",
          600: "#2072a6",
          700: "#1b5b86",
          800: "#194d70",
          900: "#103653",
          950: "#071d34",
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
          green: "#10a992",
          amber: "#c98509",
          red: "#c2413f",
          blue: "#0d6b95",
        },
      },
      boxShadow: {
        panel: "0 18px 60px rgba(5, 22, 44, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
