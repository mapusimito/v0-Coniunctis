"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

const ThemeContext = React.createContext<any>(null)

export function useTheme() {
  const context = React.useContext(ThemeContext)

  const [theme, setTheme] = React.useState("system")

  React.useEffect(() => {
    const stored = localStorage.getItem("theme")
    if (stored) {
      setTheme(stored)
    }
  }, [])

  const updateTheme = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      // System theme
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (isDark) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }

  if (!context) {
    return { theme, setTheme: updateTheme }
  }

  return context
}

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const themeState = useTheme()
  return <ThemeContext.Provider value={themeState}>{children}</ThemeContext.Provider>
}
