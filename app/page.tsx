import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, CheckSquare, Clock, Sparkles } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Coniunctis
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-primary transition-colors">
              Características
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-primary transition-colors">
              Precios
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-primary transition-colors">
              Iniciar Sesión
            </Link>
            <Button asChild>
              <Link href="/login">Comenzar</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Escribe de manera inteligente, <br />
          <br />
          Trabaja de manera inteligente
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Coniunctis combina asistencia de escritura impulsada por IA con gestión inteligente de tareas para aumentar tu
          productividad como nunca antes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
            <Link href="/login">Empieza a Escribir Gratis</Link>
          </Button>
          <Button size="lg" variant="outline">
            Ver Demo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Todo lo que necesitas para ser productivo</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Editor Impulsado por IA</h3>
              <p className="text-gray-600">
                Escribe con confianza usando nuestras herramientas inteligente que te ayuda con gramática, ortografía y
                redacción de contenido.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestor de Tareas Inteligente</h3>
              <p className="text-gray-600">
                Organiza tu trabajo con priorización inteligente de tareas e integración perfecta con nuestro sistema de Pomodoro.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Integración Pomodoro</h3>
              <p className="text-gray-600">
                Mantente enfocado con herramientas integradas de gestión del tiempo que se adaptan a tu flujo de trabajo
                y potencian la concentración.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¿Listo para transformar tu productividad?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a nuestro equipo de academicos que confían en Coniunctis.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/login">Comienza Hoy</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">Coniunctis</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2025 Coniunctis. Hecho por y para estudiantes.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
