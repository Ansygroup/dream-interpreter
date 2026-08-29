/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--text)",
        muted: "var(--muted)",
        border: "var(--border)",
        surface: "var(--surface)",
        accent: "var(--accent)",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        body: ["Outfit Variable", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono Variable", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
