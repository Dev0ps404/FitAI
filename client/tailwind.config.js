/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070b13",
        glass: "#101a2b99",
        neon: {
          cyan: "#00f5d4",
          lime: "#9ef01a",
          amber: "#ffb703",
        },
      },
      boxShadow: {
        glass: "0 10px 40px rgba(0, 0, 0, 0.35)",
        neon: "0 0 24px rgba(0, 245, 212, 0.25)",
      },
      fontFamily: {
        heading: ["Rajdhani", "sans-serif"],
        body: ["Sora", "sans-serif"],
      },
      keyframes: {
        pulseNeon: {
          "0%, 100%": {
            boxShadow: "0 0 0 rgba(0, 245, 212, 0)",
          },
          "50%": {
            boxShadow: "0 0 20px rgba(0, 245, 212, 0.35)",
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
