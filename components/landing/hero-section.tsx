import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Escribe mejor, <span className="text-blue-500">trabaja mejor</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
            La plataforma de productividad que combina escritura inteligente con IA, gestión de tareas y técnicas de
            enfoque para estudiantes y profesionales.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 text-lg">
              <Link href="/login" className="flex items-center">
                Crear cuenta gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="px-8 py-3 text-lg">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </div>

          {/* Simple visual representation */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>

              <div className="text-left space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Asistencia de IA activada</span>
                </div>

                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-2/3 border border-blue-200 dark:border-blue-800"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
