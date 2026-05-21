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
        // ── Google-style palette ────────────────────
        ink:        "#202124",         // near-black primary text
        paper:      "#FFFFFF",
        "paper-2":  "#F8F9FA",         // app canvas
        rule:       "#DADCE0",         // Google divider
        navy:       "#1A56DB",         // deep blue primary
        teal:       "#1A56DB",         // aliased → same blue
        gold:       "#5F6368",         // neutralised
        alert:      "#D93025",         // Google red
        muted:      "#5F6368",         // Google secondary text grey
        background: "#F8F9FA",
        surface:    "#FFFFFF",
        primary: {
          DEFAULT: "#1A56DB",
          dark:    "#103FA8",
          light:   "#E8F0FE",
          subtle:  "#E8F0FE",
        },
        accent: {
          DEFAULT: "#1A56DB",
        },
        // ── Status ──────────────────────────────────
        success: "#1E8E3E",
        warning: "#E37400",
        danger:  "#D93025",
      },
      fontFamily: {
        // Roboto loaded via next/font/google into --font-sans
        display: ["var(--font-sans)", "Roboto", "system-ui", "sans-serif"],
        sans:    ["var(--font-sans)", "Roboto", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "Roboto Mono", "monospace"],
      },
      fontSize: {
        display: ["30px", { lineHeight: "1.15", letterSpacing: "0", fontWeight: "500" }],
        h1:      ["22px", { lineHeight: "1.3",  letterSpacing: "0", fontWeight: "500" }],
        h2:      ["18px", { lineHeight: "1.35", letterSpacing: "0", fontWeight: "500" }],
        body:    ["14px", { lineHeight: "1.5" }],
        small:   ["12px", { lineHeight: "1.4" }],
        mono:    ["12px", { lineHeight: "1.3" }],
      },
    },
  },
  plugins: [],
};
export default config;
