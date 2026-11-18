/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#14213D", secondary: "#2A3B5C", dark: "#0B1326" },
        paper: { DEFAULT: "#F4F6F9", light: "#FAFBFC", dark: "#E3E8EF" },
        coral: { DEFAULT: "#F2594A", hover: "#DE4536", light: "#FDECE9" },
        mist: { DEFAULT: "#9AA5B8", light: "#E6EAF0", dark: "#5F6C83" },
        mint: { DEFAULT: "#17936A", light: "#E3F5EE" },
        sun: { DEFAULT: "#FFD166", light: "#FFF4D6" },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,33,61,0.05), 0 4px 14px -6px rgba(20,33,61,0.08)",
        elevated: "0 2px 4px rgba(20,33,61,0.04), 0 18px 40px -16px rgba(20,33,61,0.22)",
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.125rem", "3xl": "1.5rem" },
      keyframes: {
        rise: { "0%": { opacity: 0, transform: "translateY(12px)" }, "100%": { opacity: 1, transform: "none" } },
      },
      animation: { rise: "rise .5s cubic-bezier(.2,.7,.2,1) both" },
    },
  },
  plugins: [],
};
