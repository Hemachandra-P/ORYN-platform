"use client";

import React from "react";

interface OrynLogoProps {
  variant?: "horizontal" | "symbol" | "icon";
  theme?: "dark" | "light" | "coral";
  size?: number;
  className?: string;
  showTagline?: boolean;
}

/** Mark: an "O" ring (the flat) with a dot sitting on it (the person sharing it). */
export default function OrynLogo({ variant = "horizontal", theme = "light", size = 34, className = "", showTagline = false }: OrynLogoProps) {
  const onDark = theme === "dark";
  const word = onDark ? "#FFFFFF" : "#14213D";

  const Mark = (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden className="shrink-0">
      <rect width="40" height="40" rx="12" fill={onDark ? "#FFFFFF" : "#14213D"} />
      <circle cx="20" cy="20" r="9" stroke={onDark ? "#14213D" : "#FFFFFF"} strokeWidth="4" />
      <circle cx="27.4" cy="12.6" r="4.2" fill="#F2594A" stroke={onDark ? "#FFFFFF" : "#14213D"} strokeWidth="2" />
    </svg>
  );

  if (variant !== "horizontal") return <div className={`inline-flex ${className}`}>{Mark}</div>;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {Mark}
      <div className="flex flex-col leading-none">
        <span style={{ color: word, fontSize: size * 0.58 }} className="font-display font-extrabold tracking-[0.14em]">ORYN</span>
        {showTagline && <span className="text-[10px] text-mist-dark mt-1 tracking-wide">Everything shared. Everything simple.</span>}
      </div>
    </div>
  );
}
