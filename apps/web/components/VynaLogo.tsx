"use client";

import React from "react";

interface VynaLogoProps {
  variant?: "horizontal" | "symbol" | "icon";
  theme?: "dark" | "light" | "coral";
  size?: number;
  className?: string;
  showTagline?: boolean;
}

/** Mark: a house outline (the shared home) with a coral dot at its centre (the person sharing it). */
export default function VynaLogo({ variant = "horizontal", theme = "light", size = 34, className = "", showTagline = false }: VynaLogoProps) {
  const onDark = theme === "dark";
  const ink = onDark ? "#FFFFFF" : "#14213D";

  const Mark = (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden className="shrink-0">
      <path d="M5.5 18.5 20 5.5l14.5 13V31a4 4 0 0 1-4 4h-21a4 4 0 0 1-4-4V18.5Z" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="20" cy="23.5" r="5" fill="#F2594A" />
    </svg>
  );

  if (variant !== "horizontal") return <div className={`inline-flex ${className}`}>{Mark}</div>;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {Mark}
      <div className="flex flex-col leading-none">
        <span style={{ color: ink, fontSize: size * 0.62 }} className="font-display font-semibold tracking-[0.22em]">VYNA</span>
        {showTagline && <span className="text-[10px] text-mist-dark mt-1 tracking-wide">Everything shared. Everything simple.</span>}
      </div>
    </div>
  );
}
