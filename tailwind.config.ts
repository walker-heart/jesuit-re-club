import type { Config } from "tailwindcss";

export default {
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#003c71",
        gold: "#b3a369",
        border: {
          DEFAULT: "#e5e7eb",
          dark: "#d1d5db",
        },
        primary: {
          DEFAULT: "#003c71",
          dark: "#002855",
          light: "#004e8e",
        },
        secondary: {
          DEFAULT: "#b3a369",
          dark: "#8f815a",
          light: "#c4b78e",
        },
        background: {
          DEFAULT: "#f8f9fa",
          alt: "#ffffff",
        },
        foreground: {
          DEFAULT: "#1a1a1a",
          muted: "#6b7280",
        },
        muted: {
          DEFAULT: "#f3f4f6",
          foreground: "#6b7280",
        },
        accent: {
          DEFAULT: "#003c71",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#059669",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#eab308",
          foreground: "#1a1a1a",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      boxShadow: {
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#1a1a1a",
            a: {
              color: "#003c71",
              "&:hover": {
                color: "#002855",
              },
            },
            h1: {
              color: "#003c71",
            },
            h2: {
              color: "#003c71",
            },
            h3: {
              color: "#003c71",
            },
            h4: {
              color: "#003c71",
            },
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
