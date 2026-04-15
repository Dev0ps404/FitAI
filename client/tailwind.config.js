/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f0f1a",
        glass: "#ffffff0d",
        primary: "#7c3aed",
        secondary: "#a78bfa",
        sky: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
        },
        neon: {
          cyan: "#7c3aed",
          lime: "#a78bfa",
          amber: "#8b5cf6",
        },
      },
      boxShadow: {
        glass: "0 18px 45px rgba(8, 4, 22, 0.45)",
        neon: "0 0 22px rgba(124, 58, 237, 0.35)",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      keyframes: {
        pulseNeon: {
          "0%, 100%": {
            boxShadow: "0 0 0 rgba(124, 58, 237, 0)",
          },
          "50%": {
            boxShadow: "0 0 18px rgba(124, 58, 237, 0.45)",
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
