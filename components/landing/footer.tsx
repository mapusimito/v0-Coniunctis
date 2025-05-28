import Link from "next/link"
import { FileText, Mail, Phone } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"

export function Footer() {
  const { theme } = useTheme()
  const logoSrc =
    theme === "dark"
      ? "/images/coniunctis-logo-dark.png"
      : "/images/coniunctis-logo-light.png"

  return (
    <footer id="contact" className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 relative">
                <Image
                  src={logoSrc}
                  alt="Coniunctis Logo"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">Coniunctis</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300">Hecho por y para estudiantes.</p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Navegación</h4>
            <div className="space-y-2">
              <Link
                href="/"
                className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Inicio
              </Link>
              <Link
                href="#features"
                className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Funciones
              </Link>
              <Link
                href="#ai"
                className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Inteligencia Artificial
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Producto</h4>
            <div className="space-y-2">
              <Link
                href="/login"
                className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/login"
                className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Crear cuenta
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Contacto</h4>
            <div className="space-y-2">
              <a
                href="mailto:dagamapu@gmail.com"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>dagamapu@gmail.com</span>
              </a>
              <a
                href="tel:+584245379758"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>+58 424 537 9758</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">© 2024 Coniunctis. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
