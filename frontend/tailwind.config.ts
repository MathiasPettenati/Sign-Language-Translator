import type { Config } from "tailwindcss";

const silverScale = {
  50: "#ffffff",
  100: "#f7f7f7",
  200: "#ececec",
  300: "#d8d8d8",
  400: "#c0c0c0",
  500: "#a8a8a8",
  600: "#858585",
  700: "#666666",
  800: "#4a4a4a",
  900: "#333333",
  950: "#222222",
};

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        app: "#f7f7f7",
        paper: "#eeeeee",
        "paper-light": "#ffffff",
        deep: silverScale,
        ink: silverScale,
        gold: silverScale,
        sage: silverScale,
      },
      boxShadow: {
        panel: "0 18px 60px rgba(80, 80, 80, 0.13)",
      },
    },
  },
  plugins: [],
} satisfies Config;
