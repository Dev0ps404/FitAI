/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#fcf9ff",
        glass: "#ffffffe0",
        sky: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
        },
        neon: {
          cyan: "#7c3aed",
          lime: "#9333ea",
          amber: "#a855f7",
        },
      },
      boxShadow: {
        glass: "0 14px 42px rgba(124, 58, 237, 0.16)",
        neon: "0 0 22px rgba(147, 51, 234, 0.35)",
      },
      fontFamily: {
        heading: ["Rajdhani", "sans-serif"],
        body: ["Sora", "sans-serif"],
      },
      keyframes: {
        pulseNeon: {
          "0%, 100%": {
            boxShadow: "0 0 0 rgba(147, 51, 234, 0)",
          },
          "50%": {
            boxShadow: "0 0 18px rgba(147, 51, 234, 0.45)",
          },
        },
      },
      animation: {
        "pulse-neon": "pulseNeon 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
