/** @type {import('tailwindcss').Config} */
import { fontFamily } from "tailwindcss/defaultTheme"
import defaultConfig from "shadcn/ui/tailwind.config"

module.exports = {
  ...defaultConfig,
  content: [...defaultConfig.content, "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    ...defaultConfig.theme,
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      ...defaultConfig.theme.extend,
      colors: {
        ...defaultConfig.theme.extend.colors,
        card: "rgb(255, 255, 255)",
        "card-foreground": "rgb(38, 36, 31)",
        primary: {
          DEFAULT: "rgb(221, 133, 85)",
          foreground: "rgb(210, 102, 255)",
        },
        secondary: {
          DEFAULT: "rgb(24, 242, 85)",
          foreground: "rgb(210, 102, 255)",
        },
        muted: "rgb(210, 204, 240)",
        "muted-foreground": "rgb(118, 117, 119)",
        accent: "rgb(210, 204, 240)",
        "accent-foreground": "rgb(38, 36, 31)",
        destructive: "rgb(154, 21, 0)",
        "destructive-foreground": "rgb(210, 102, 255)",
        "sidebar-background": "rgb(250, 250, 250)",
        "sidebar-foreground": "rgb(70, 68, 64)",
        "sidebar-primary": "rgb(70, 70, 70)",
        "sidebar-primary-foreground": "rgb(255, 255, 255)",
        "sidebar-accent": "rgb(244, 244, 244)",
        "sidebar-accent-foreground": "rgb(70, 70, 70)",
        "sidebar-border": "rgb(220, 217, 232)",
        "sidebar-ring": "rgb(221, 133, 85)",
        "chart-1": "rgb(12, 194, 157)",
        "chart-2": "rgb(173, 148, 99)",
        "chart-3": "rgb(197, 99, 60)",
        "chart-4": "rgb(43, 189, 166)",
        "chart-5": "rgb(27, 221, 167)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [...defaultConfig.plugins, require("tailwindcss-animate")],
}
