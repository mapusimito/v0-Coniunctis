"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { FileText } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900 dark:text-white">Coniunctis</span>
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
