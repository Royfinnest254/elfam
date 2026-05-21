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
        // ── Monochromatic / Max Contrast Layout ────────────────────
        ink:        "#000000",         // pure bold black primary text
        paper:      "#FFFFFF",         // pure solid white background
        "paper-2":  "#FFFFFF",         // app canvas (pure solid white)
        rule:       "#E5E7EB",         // very light gray divider
        navy:       "#1A56DB",         // deep blue primary
        teal:       "#1A56DB",         // aliased → same blue
        gold:       "#5F6368",         // neutralised
        alert:      "#D93025",         // Google red
        muted:      "#4B5563",         // charcoal gray secondary text
        background: "#FFFFFF",         // pure solid white background
        surface:    "#FFFFFF",         // pure solid white surface
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
        // Inter loaded via next/font/google into --font-sans
        display: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        sans:    ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "JetBrains Mono", "monospace"],
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
