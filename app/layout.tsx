import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CONIUNCTIS - Plataforma de Productividad impulsada por IA",
  description:
    "Transforma tu productividad con asistencia de escritura impulsada por IA, gestión inteligente de tareas y técnicas de enfoque.",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/coniunctis-logo.png",
    apple: "/images/coniunctis-logo.png",
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
