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
        // ── Highland Green & Cream Theme ──────────────────────────
        ink:        "#0f1411",         // charcoal forest ink text
        paper:      "#fafaf5",         // soft cream-paper background
        "paper-2":  "#f0efe6",         // secondary darker paper
        rule:       "#d8d6c9",         // raw rule/border divider line
        moss:       "#1f3a2e",         // highland moss green
        "moss-2":   "#2d5440",         // hover/lighter moss
        cream:      "#f5f2e3",         // heritage cream
        pasture:    "#6b8e5a",         // secondary pasture green
        alert:      "#a8341f",         // highland warning rust/red
        
        background: "#fafaf5",
        surface:    "#fafaf5",
        primary: {
          DEFAULT: "#1f3a2e",
          dark:    "#14251e",
          light:   "#f5f2e3",
          subtle:  "#fcfbf7",
        },
        accent: {
          DEFAULT: "#6b8e5a",
        },
        // ── Status ──────────────────────────────────
        success: "#6b8e5a",
        warning: "#d29034",
        danger:  "#a8341f",
      },
      fontFamily: {
        display: ["var(--font-display)", "Fraunces", "serif"],
        sans:    ["var(--font-sans)", "Inter Tight", "sans-serif"],
        mono:    ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        display: ["32px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "500" }],
        h1:      ["24px", { lineHeight: "1.2",  letterSpacing: "-0.01em", fontWeight: "500" }],
        h2:      ["19px", { lineHeight: "1.3", letterSpacing: "0", fontWeight: "500" }],
        body:    ["14px", { lineHeight: "1.5" }],
        small:   ["12px", { lineHeight: "1.4" }],
        mono:    ["12px", { lineHeight: "1.3" }],
      },
    },
  },
  plugins: [],
};
export default config;
