import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { NotificationCenter } from "@/components/notification-center"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CONIUNCTIS - AI-Powered Productivity Platform",
  description:
    "Transform your productivity with AI-powered writing assistance, smart task management, and focus techniques.",
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
            <NotificationCenter />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
