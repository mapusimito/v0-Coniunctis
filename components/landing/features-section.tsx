"use client"
import { Brain, CheckSquare, Clock } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "Inteligencia Artificial",
    description:
      "Asistente y productor de contenido que mejora tu escritura en tiempo real con sugerencias inteligentes.",
  },
  {
    icon: CheckSquare,
    title: "Gestión de Tareas",
    description: "Organiza y prioriza tu trabajo con un sistema inteligente que se integra perfectamente con tu flujo.",
  },
  {
    icon: Clock,
    title: "Técnica Pomodoro",
    description: "Mantén el enfoque con sesiones de trabajo cronometradas y descansos programados automáticamente.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Todo lo que necesitas para ser productivo
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Herramientas diseñadas específicamente para estudiantes y profesionales que buscan optimizar su tiempo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <feature.icon className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
