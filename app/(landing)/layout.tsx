import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Coniunctis - Escribe mejor, trabaja mejor",
  description:
    "Plataforma de productividad que combina escritura inteligente con IA, gestión de tareas y técnicas de enfoque para estudiantes y profesionales.",
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
