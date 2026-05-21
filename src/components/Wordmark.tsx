import React from "react";

interface WordmarkProps {
  size?: number;
  tone?: "ink" | "cream" | "white" | "navy" | "blue";
}

export default function Wordmark({ size = 20, tone = "ink" }: WordmarkProps) {
  let colorClass = "text-[#202124]";
  if (tone === "cream" || tone === "white") colorClass = "text-white";
  else if (tone === "navy" || tone === "blue") colorClass = "text-primary";
  
  return (
    <span
      className={`font-sans font-semibold tracking-[0.15em] select-none transition-colors ${colorClass}`}
      style={{ fontSize: `${size}px` }}
    >
      Elfam
    </span>
  );
}

