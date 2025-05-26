import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "rgb(59, 130, 246)", // Blue
          foreground: "rgb(255, 255, 255)",
        },
        secondary: {
          DEFAULT: "rgb(249, 115, 22)", // Orange
          foreground: "rgb(255, 255, 255)",
        },
        accent: {
          DEFAULT: "rgb(239, 246, 255)", // Very light blue
          foreground: "rgb(30, 64, 175)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        "sidebar-background": "rgb(250, 250, 250)",
        "sidebar-foreground": "rgb(70, 68, 64)",
        "sidebar-primary": "rgb(70, 70, 70)",
        "sidebar-primary-foreground": "rgb(255, 255, 255)",
        "sidebar-accent": "rgb(244, 244, 244)",
        "sidebar-accent-foreground": "rgb(70, 70, 70)",
        "sidebar-border": "rgb(220, 217, 232)",
        "sidebar-ring": "rgb(59, 130, 246)",
        "chart-1": "rgb(12, 194, 157)",
        "chart-2": "rgb(173, 148, 99)",
        "chart-3": "rgb(197, 99, 60)",
        "chart-4": "rgb(43, 189, 166)",
        "chart-5": "rgb(27, 221, 167)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
