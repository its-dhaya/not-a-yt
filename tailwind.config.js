/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["DM Serif Display", "Georgia", "serif"],
      },
      keyframes: {
        shimmer: { "0%,100%": { opacity: "0.4" }, "50%": { opacity: "0.85" } },
        voicebar: {
          "0%,100%": { transform: "scaleY(0.5)", opacity: "0.5" },
          "50%": { transform: "scaleY(1.2)", opacity: "1" },
        },
        fadeup: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s ease-in-out infinite",
        voicebar: "voicebar 0.8s ease-in-out infinite",
        fadeup: "fadeup 0.4s ease forwards",
      },
    },
  },
  plugins: [],
};
