export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#00ffb4",
        "primary-dim": "#00cc90",
        "bg-dark": "#0f231d",
        "bg-card": "#132a22",
        "bg-surface": "#1a3a2e",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
    },
  },
}
