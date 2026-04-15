/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b142a",
        glass: "#ffffff0d",
        primary: "#2563eb",
        secondary: "#60a5fa",
        sky: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
        },
        neon: {
          cyan: "#2563eb",
          lime: "#60a5fa",
          amber: "#0ea5e9",
        },
      },
      boxShadow: {
        glass: "0 18px 45px rgba(4, 12, 30, 0.45)",
        neon: "0 0 22px rgba(37, 99, 235, 0.35)",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      keyframes: {
        pulseNeon: {
          "0%, 100%": {
            boxShadow: "0 0 0 rgba(37, 99, 235, 0)",
          },
          "50%": {
            boxShadow: "0 0 18px rgba(37, 99, 235, 0.45)",
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
