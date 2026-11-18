"use client";

import React from "react";

interface OrynLogoProps {
  variant?: "horizontal" | "symbol" | "icon";
  theme?: "dark" | "light" | "coral";
  size?: number;
  className?: string;
  showTagline?: boolean;
}

export default function OrynLogo({
  variant = "horizontal",
  theme = "dark",
  size = 36,
  className = "",
  showTagline = false,
}: OrynLogoProps) {
  // Theme color resolutions
  const isLight = theme === "light";
  const primaryText = isLight ? "#14213D" : "#FFFFFF";
  const ringPrimary = isLight ? "#14213D" : "#FFFFFF";
  const ringAccent = "#FF6B5B";

  // Geometric O Symbol: Interlocking dual-orbit rings forming a modern techno "O"
  const Symbol = ({ s = size }: { s: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="orynGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B5B" />
          <stop offset="1" stopColor="#E04D3D" />
        </linearGradient>
        <linearGradient id="orynInnerGrad" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor={ringPrimary} />
          <stop offset="1" stopColor={isLight ? "#253A56" : "#A9B4C3"} />
        </linearGradient>
      </defs>

      {/* Background Soft Glow / Rounded Base */}
      <rect width="48" height="48" rx="14" fill={isLight ? "#14213D" : "#1B2C4E"} />

      {/* Outer Continuous Dynamic Ring */}
      <circle
        cx="24"
        cy="24"
        r="14"
        stroke="url(#orynGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="64 24"
      />

      {/* Inner Interlocking Loop (The Connected Core) */}
      <circle
        cx="24"
        cy="24"
        r="8"
        stroke={ringPrimary}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="36 14"
        transform="rotate(180 24 24)"
      />

      {/* Dynamic Sync Node Dot */}
      <circle cx="34" cy="14" r="3" fill="#FF6B5B" />
      <circle cx="14" cy="34" r="2.2" fill={isLight ? "#FFFFFF" : "#FF6B5B"} />
    </svg>
  );

  if (variant === "symbol" || variant === "icon") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <Symbol s={size} />
      </div>
    );
  }

  // Horizontal Logo: Geometric Symbol + Clean, Spaced Monospace-Inspired Wordmark
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <Symbol s={size} />
      <div className="flex flex-col justify-center">
        <div className="flex items-center tracking-tight leading-none">
          <span
            style={{ color: primaryText, fontSize: size * 0.65 }}
            className="font-black tracking-widest uppercase font-sans"
          >
            ORYN
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-coral ml-1 animate-pulse"></span>
        </div>
        {showTagline && (
          <span
            style={{ fontSize: Math.max(9, size * 0.24) }}
            className="text-mutedblue font-semibold tracking-wider uppercase mt-0.5"
          >
            Everything Shared. Everything Simple.
          </span>
        )}
      </div>
    </div>
  );
}
