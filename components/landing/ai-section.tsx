import { MessageSquare, Wand2, CheckCircle, PlusCircle, FileText, BookOpen } from "lucide-react"

export function AISection() {
  return (
    <section id="ai" className="py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Inteligencia Artificial que entiende tu escritura
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Nuestra IA está dividida en dos herramientas especializadas que trabajan juntas para mejorar tu
              productividad y calidad de escritura.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Asistente */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Asistente</h3>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                Tu compañero de escritura que perfecciona y optimiza tu contenido existente.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Corrección gramatical</h4>
                    <p className="text-gray-600 dark:text-gray-300">Detecta y corrige errores automáticamente</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MessageSquare className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Explicación de conceptos</h4>
                    <p className="text-gray-600 dark:text-gray-300">Clarifica ideas complejas de forma simple</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Wand2 className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Simplificación y complejización</h4>
                    <p className="text-gray-600 dark:text-gray-300">Adapta el nivel de tu texto según la audiencia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Productor */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950 rounded-xl flex items-center justify-center">
                  <PlusCircle className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Productor</h3>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                Genera contenido nuevo y expande tus ideas para crear textos más ricos y completos.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <PlusCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Expansión de contenido</h4>
                    <p className="text-gray-600 dark:text-gray-300">Desarrolla ideas con más detalle y profundidad</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Generación de contenido</h4>
                    <p className="text-gray-600 dark:text-gray-300">Crea texto nuevo basado en tus indicaciones</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <BookOpen className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Creación de esquemas</h4>
                    <p className="text-gray-600 dark:text-gray-300">Estructura tus ideas en formatos organizados</p>
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
