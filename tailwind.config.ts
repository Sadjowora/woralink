import plugin from "tailwindcss/plugin";
import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: "#059669",
        "primary-dark": "#047857",
        "accents-1": "#fafafa",
        "accents-2": "#f5f5f5",
        "accents-3": "#e5e5e5",
        "accents-4": "#d4d4d4",
        "accents-5": "#a3a3a3",
        "accents-6": "#737373",
        "accents-7": "#404040",
        "accents-8": "#171717",
        gray: {
          100: "#f3f4f6",
        },
      },
      fontFamily: {
        sans: ["Geist", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tight: "-0.02em",
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "0.5rem",
        "2xl": "0.5rem",
        "3xl": "0.375rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        body: {
          letterSpacing: "-0.02em",
          fontFamily: "Geist, Inter, ui-sans-serif, system-ui, sans-serif",
        },
      });
    }),
  ],
};

export default config;
