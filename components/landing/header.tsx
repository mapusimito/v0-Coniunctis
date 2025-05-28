"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { FileText } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"
export function Header() {
  const { theme } = useTheme()
  const logoSrc =
    theme === "dark"
      ? "/images/coniunctis-logo-dark.png"
      : "/images/coniunctis-logo-light.png"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="relative w-40 h-16">
            <Image
              src={logoSrc}
              alt="Coniunctis Logo"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="#features"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Funciones
          </Link>
          <Link
            href="#ai"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            IA
          </Link>
          <Link
            href="#contact"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Contacto
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
              <Link href="/login">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
