import React from "react";

interface WordmarkProps {
  size?: number;
  tone?: "ink" | "cream" | "moss" | "pasture";
}

export default function Wordmark({ size = 20, tone = "ink" }: WordmarkProps) {
  let colorClass = "text-ink";
  if (tone === "cream") colorClass = "text-cream";
  else if (tone === "moss") colorClass = "text-moss";
  else if (tone === "pasture") colorClass = "text-pasture";
  
  return (
    <span
      className={`font-display font-medium select-none transition-colors ${colorClass}`}
      style={{ fontSize: `${size}px` }}
    >
      elfam
    </span>
  );
}

