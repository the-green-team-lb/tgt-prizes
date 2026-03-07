import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: "#d4af37",
          green: "#228b22",
          "green-light": "#32cd32",
          bg: "#1e2f1e",
          card: "#2a3d2a",
          border: "#d4af37",
          text: "#e8e5db",
          muted: "#9aaa9a",
          dark: "#1a1a1a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
