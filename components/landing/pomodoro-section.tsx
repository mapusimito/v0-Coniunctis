import { Clock, BarChart3, Target, Zap } from "lucide-react"

export function PomodoroSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
              <div className="text-center space-y-6">
                <div className="w-32 h-32 mx-auto bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center border-4 border-red-200 dark:border-red-800">
                  <div className="text-3xl font-bold text-red-500">25:00</div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Sesión de enfoque</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Trabajando en: Escribir ensayo</p>
                </div>

                <div className="flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">Pomodoro 1 de 4 • Descanso en 25 min</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-950 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Técnica Pomodoro inteligente
                </h2>
              </div>

              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Mantén el enfoque con sesiones de trabajo cronometradas, métricas visuales y seguimiento automático de
                tu productividad.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Seguimiento por tarea</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Cada pomodoro se registra automáticamente en la tarea correspondiente
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <BarChart3 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Métricas visuales</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Visualiza tu progreso diario y semanal con gráficos detallados
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Finalización automática</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Descansos programados y transiciones automáticas entre sesiones
                    </p>
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
