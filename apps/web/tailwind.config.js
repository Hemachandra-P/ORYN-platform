/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#14213D",
          secondary: "#253A56",
          dark: "#0b1222",
        },
        cream: {
          DEFAULT: "#F4EDE0",
          light: "#FAF7F2",
          dark: "#E8DEC9",
        },
        coral: {
          DEFAULT: "#FF6B5B",
          hover: "#FA5543",
          light: "#FFEAE8",
        },
        mutedblue: {
          DEFAULT: "#A9B4C3",
          light: "#E3E7ED",
          dark: "#7A8799",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(20, 33, 61, 0.06), 0 2px 6px -1px rgba(20, 33, 61, 0.04)",
        elevated: "0 12px 30px -4px rgba(20, 33, 61, 0.12), 0 4px 10px -2px rgba(20, 33, 61, 0.06)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      }
    },
  },
  plugins: [],
}
