/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "rgba(0,0,0,0.1)",
        input: "rgba(0,0,0,0.1)",
        ring: "#0075de",
        background: "#ffffff",
        foreground: "rgba(0,0,0,0.95)",
        primary: {
          DEFAULT: "#0075de",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "rgba(0,0,0,0.05)",
          foreground: "rgba(0,0,0,0.95)",
        },
        destructive: {
          DEFAULT: "#dd5b00",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f6f5f4",
          foreground: "#615d59",
        },
        accent: {
          DEFAULT: "#f2f9ff",
          foreground: "#097fe8",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "rgba(0,0,0,0.95)",
        },
        notion: {
          blue: "#0075de",
          "warm-white": "#f6f5f4",
          "warm-dark": "#31302e",
          "gray-500": "#615d59",
          "gray-300": "#a39e98",
          "badge-bg": "#f2f9ff",
          "badge-text": "#097fe8",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "system-ui", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
      },
      letterSpacing: {
        "tightest": "-2.125px", // For 64px
        "tighter-hero": "-1.875px", // For 54px
        "tighter-section": "-1.5px", // For 48px
        "tight-sub": "-0.625px", // For 26px
        "tight-card": "-0.25px", // For 22px
        "tight-body": "-0.125px", // For 20px
        "badge": "0.125px", // For 12px
      },
      boxShadow: {
        "notion-card": "rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2.025px 7.84688px, rgba(0,0,0,0.02) 0px 0.8px 2.925px, rgba(0,0,0,0.01) 0px 0.175px 1.04062px",
        "notion-deep": "rgba(0,0,0,0.01) 0px 1px 3px, rgba(0,0,0,0.02) 0px 3px 7px, rgba(0,0,0,0.02) 0px 7px 15px, rgba(0,0,0,0.04) 0px 14px 28px, rgba(0,0,0,0.05) 0px 23px 52px",
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
        pill: "9999px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
