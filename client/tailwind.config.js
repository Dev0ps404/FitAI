/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f8fbff",
        glass: "#ffffffd9",
        neon: {
          cyan: "#06b6d4",
          lime: "#84cc16",
          amber: "#f59e0b",
        },
      },
      boxShadow: {
        glass: "0 12px 40px rgba(14, 116, 144, 0.14)",
        neon: "0 0 22px rgba(6, 182, 212, 0.3)",
      },
      fontFamily: {
        heading: ["Rajdhani", "sans-serif"],
        body: ["Sora", "sans-serif"],
      },
      keyframes: {
        pulseNeon: {
          "0%, 100%": {
            boxShadow: "0 0 0 rgba(6, 182, 212, 0)",
          },
          "50%": {
            boxShadow: "0 0 18px rgba(6, 182, 212, 0.4)",
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
