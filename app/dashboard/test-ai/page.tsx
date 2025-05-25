"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { testGeminiConnection } from "@/app/actions/ai-actions"
import { AIService } from "@/lib/ai-service"

export default function TestAIPage() {
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [testText, setTestText] = useState(
    "Este es un texto de prueba para verificar que la IA funciona correctamente.",
  )
  const [suggestion, setSuggestion] = useState<string>("")
  const [improvedText, setImprovedText] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const aiService = AIService.getInstance()

  const handleTestConnection = async () => {
    setLoading(true)
    try {
      const result = await testGeminiConnection()
      setConnectionStatus(result)
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
      })
    }
    setLoading(false)
  }

  const handleTestSuggestion = async () => {
    setLoading(true)
    try {
      const result = await aiService.getSuggestion(testText)
      setSuggestion(result.suggestion)
    } catch (error) {
      setSuggestion(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
    setLoading(false)
  }

  const handleTestImprovement = async () => {
    setLoading(true)
    try {
      const result = await aiService.improveText(testText)
      setImprovedText(result)
    } catch (error) {
      setImprovedText(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Prueba de IA - Gemini</h1>
        <Badge variant={connectionStatus?.success ? "default" : "destructive"}>
          {connectionStatus?.success ? "Conectado" : "Desconectado"}
        </Badge>
      </div>

      <div className="grid gap-6">
        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle>Prueba de Conexión</CardTitle>
            <CardDescription>Verifica que la API de Gemini esté configurada correctamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleTestConnection} disabled={loading}>
              {loading ? "Probando..." : "Probar Conexión"}
            </Button>
            {connectionStatus && (
              <div
                className={`p-4 rounded-lg ${connectionStatus.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
              >
                <p className="font-medium">{connectionStatus.success ? "✅ Éxito" : "❌ Error"}</p>
                <p className="text-sm mt-1">{connectionStatus.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Text Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Prueba de Funciones de IA</CardTitle>
            <CardDescription>Prueba las diferentes funciones de IA con texto personalizado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Texto de prueba:</label>
              <Textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Escribe un texto para probar las funciones de IA..."
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleTestSuggestion} disabled={loading} variant="outline">
                Obtener Sugerencia
              </Button>
              <Button onClick={handleTestImprovement} disabled={loading} variant="outline">
                Mejorar Texto
              </Button>
            </div>

            {suggestion && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800">Sugerencia:</p>
                <p className="text-blue-700 mt-1">{suggestion}</p>
              </div>
            )}

            {improvedText && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-medium text-green-800">Texto mejorado:</p>
                <p className="text-green-700 mt-1">{improvedText}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Variables Check */}
        <Card>
          <CardHeader>
            <CardTitle>Variables de Entorno</CardTitle>
            <CardDescription>Estado de las variables de entorno necesarias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>GEMINI_API_KEY</span>
                <Badge variant="outline">
                  {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "❌ Expuesta (inseguro)" : "✅ Segura"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                La clave de API debe estar configurada como variable de entorno del servidor (sin NEXT_PUBLIC_)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
