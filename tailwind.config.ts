import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#091E42",
        paper: "#FFFFFF",
        "paper-2": "#F4F5F7",
        rule: "#DFE1E6",
        navy: "#0F1B2D",
        teal: "#00869B",
        gold: "#C09E5A",
        alert: "#FF5630",
        muted: "#5E6C84",
        background: "#F4F5F7",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#0F1B2D",
          dark: "#0A1220",
          light: "#00869B",
          subtle: "#E6F3F5",
        },
        accent: {
          DEFAULT: "#091E42",
        },
        success: "#36B37E",
        warning: "#FFAB00",
        danger: "#FF5630",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        display: ["32px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "900" }],
        h1: ["24px", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "900" }],
        h2: ["18px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "800" }],
        body: ["14px", { lineHeight: "1.5" }],
        small: ["12px", { lineHeight: "1.4" }],
        mono: ["12px", { lineHeight: "1.3" }],
      },
    },
  },
  plugins: [],
};
export default config;

