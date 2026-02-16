import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#d9af30", // Gold
        "background-light": "#f8f7f6",
        "background-dark": "#0F172A", // Deep Charcoal
        "card-dark": "#1E293B",
        "text-muted": "#94A3B8",
        "success-emerald": "#10B981",
      },
      fontFamily: {
        display: ["var(--font-public-sans)", "sans-serif"],
        serif: ["var(--font-merriweather)", "serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
