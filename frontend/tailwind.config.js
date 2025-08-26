// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        text: "var(--text)",
        border: "var(--border)",
        accent: "var(--accent)",
        accentStrong: "var(--accent-strong)",
        muted: "var(--muted)",
      },
    },
  },
  plugins: [],
};
