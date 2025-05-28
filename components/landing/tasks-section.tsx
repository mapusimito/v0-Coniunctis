"use client"
import { CheckSquare, Clock, Target, TrendingUp } from "lucide-react"

export function TasksSection() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-950 rounded-xl flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-green-500" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Gestión inteligente de tareas
                </h2>
              </div>

              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Organiza tu trabajo de manera eficiente con un sistema que se integra perfectamente con la técnica
                Pomodoro para maximizar tu productividad.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Planificación de sesiones</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Estima cuántos pomodoros necesitas para cada tarea y planifica tu día
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Integración con Pomodoro</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Cada tarea se conecta automáticamente con el temporizador para un seguimiento preciso
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Monitoreo de progreso</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Visualiza tu productividad y mejora tus estimaciones con datos reales
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Tareas de hoy</h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">3/5 completadas</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckSquare className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-900 dark:text-white line-through">Revisar capítulo 3</span>
                    <span className="text-xs text-green-600 dark:text-green-400 ml-auto">🍅 2/2</span>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                    <span className="text-sm text-gray-900 dark:text-white">Escribir ensayo</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">🍅 1/4</span>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded"></div>
                    <span className="text-sm text-gray-900 dark:text-white">Preparar presentación</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">🍅 0/3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
