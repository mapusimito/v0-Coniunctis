"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Sparkles,
  Save,
  Loader2,
  Wand2,
  FileText,
  CheckCircle,
  BookOpen,
  Zap,
  MessageSquare,
  PlusCircle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { AIService } from "@/lib/ai-service"

export default function EditorPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentId = searchParams.get("id")
  const aiService = AIService.getInstance()

  const [document, setDocument] = useState({
    id: "",
    title: "Documento sin título",
    content: "",
    project_tag: "General",
    progress_percentage: 0,
    status: "draft" as const,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)
  const [aiResult, setAiResult] = useState("")
  const [isAILoading, setIsAILoading] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [lastSavedContent, setLastSavedContent] = useState("")
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (documentId && user) {
      loadDocument(documentId)
    } else if (user) {
      setDocument({
        id: "",
        title: "Documento sin título",
        content: "",
        project_tag: "General",
        progress_percentage: 0,
        status: "draft",
      })
    }
  }, [documentId, user])

  const loadDocument = async (id: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("documents").select("*").eq("id", id).eq("user_id", user?.id).single()

      if (error) throw error

      setDocument(data)
      updateWordCount(data.content || "")
    } catch (error) {
      console.error("Error loading document:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateWordCount = (text: string) => {
    const words = text.split(/\s+/).filter((word) => word.length > 0)
    setWordCount(words.length)
    setCharCount(text.length)
  }

  const saveDocument = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const content = document.content

      const documentData = {
        title: document.title,
        content,
        word_count: wordCount,
        project_tag: document.project_tag,
        progress_percentage: document.progress_percentage,
        status: document.status,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }

      if (document.id) {
        const { error } = await supabase.from("documents").update(documentData).eq("id", document.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from("documents").insert(documentData).select().single()
        if (error) throw error
        setDocument((prev) => ({ ...prev, id: data.id }))
        router.replace(`/dashboard/editor?id=${data.id}`)
      }
      setLastSavedContent(content) // Actualiza el contenido guardado
    } catch (error) {
      console.error("Error saving document:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleContentChange = (value: string) => {
    setDocument((prev) => ({ ...prev, content: value }))
    updateWordCount(value)
  }

  const getSelectedText = () => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart
      const end = editorRef.current.selectionEnd
      return editorRef.current.value.substring(start, end)
    }
    return ""
  }

  const replaceSelectedText = (newText: string) => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart
      const end = editorRef.current.selectionEnd
      const content = document.content
      const newContent = content.substring(0, start) + newText + content.substring(end)
      setDocument((prev) => ({ ...prev, content: newContent }))
      updateWordCount(newContent)
    }
  }

  const insertTextAtCursor = (text: string) => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart
      const content = document.content
      const newContent = content.substring(0, start) + text + content.substring(start)
      setDocument((prev) => ({ ...prev, content: newContent }))
      updateWordCount(newContent)
    }
  }

  // AI Functions
  const handleAssistant = async (action: "grammar" | "explain" | "simple" | "complex") => {
    const text = getSelectedText() || document.content
    if (!text.trim()) {
      setAiResult("Por favor selecciona texto o escribe algo primero.")
      setShowAI(true)
      return
    }

    setSelectedText(text)
    setIsAILoading(true)
    setShowAI(true)

    try {
      let result = ""
      switch (action) {
        case "grammar":
          result = await aiService.checkGrammar(text)
          break
        case "explain":
          result = await aiService.explainText(text)
          break
        case "simple":
          result = await aiService.simplifyText(text)
          break
        case "complex":
          result = await aiService.complexifyText(text)
          break
      }
      setAiResult(result)
    } catch (error) {
      console.error("Error in assistant:", error)
      setAiResult("Error al procesar el texto. Por favor, inténtalo más tarde.")
    } finally {
      setIsAILoading(false)
    }
  }

  const handleProducer = async (action: "expand" | "generate" | "scheme") => {
    const text = action === "scheme" ? document.title : getSelectedText() || document.content
    if (!text.trim()) {
      setAiResult("Por favor proporciona texto o un tema.")
      setShowAI(true)
      return
    }

    setSelectedText(text)
    setIsAILoading(true)
    setShowAI(true)

    try {
      let result = ""
      switch (action) {
        case "expand":
          result = await aiService.expandText(text)
          break
        case "generate":
          result = await aiService.generateContent(text)
          break
        case "scheme":
          result = await aiService.createScheme(text)
          break
      }
      setAiResult(result)
    } catch (error) {
      console.error("Error in producer:", error)
      setAiResult("Error al generar contenido. Por favor, inténtalo más tarde.")
    } finally {
      setIsAILoading(false)
    }
  }

  const generateTitle = async () => {
    if (!document.content.trim()) return

    setIsAILoading(true)
    try {
      const title = await aiService.generateTitle(document.content)
      setDocument((prev) => ({ ...prev, title }))
    } catch (error) {
      console.error("Error generating title:", error)
    } finally {
      setIsAILoading(false)
    }
  }

  const applyAIResult = () => {
    if (selectedText && getSelectedText()) {
      replaceSelectedText(aiResult)
    } else {
      insertTextAtCursor(aiResult)
    }
    setShowAI(false)
  }

  // Nuevo useEffect para autoguardado cada 15 segundos si hubo cambios
  useEffect(() => {
    if (!user) return

    autoSaveIntervalRef.current = setInterval(() => {
      if (document.content !== lastSavedContent) {
        saveDocument()
        setLastSavedContent(document.content)
      }
    }, 15000) // 15 segundos

    return () => {
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.content, user])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Cargando documento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
        <div className="flex items-center space-x-2">
          <Input
            value={document.title}
            onChange={(e) => setDocument((prev) => ({ ...prev, title: e.target.value }))}
            className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0"
            placeholder="Título del documento..."
          />
          <Button variant="ghost" size="sm" onClick={generateTitle} disabled={isAILoading}>
            <Zap className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-4 mt-2">
          <div className="flex items-center space-x-2">
            <Label className="text-sm">Proyecto:</Label>
            <Select
          value={document.project_tag}
          onValueChange={(value) => setDocument((prev) => ({ ...prev, project_tag: value }))}
            >
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="General">General</SelectItem>
            <SelectItem value="Trabajo">Trabajo</SelectItem>
            <SelectItem value="Personal">Personal</SelectItem>
            <SelectItem value="Investigación">Investigación</SelectItem>
          </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{wordCount} palabras</span>
            <span>{charCount} caracteres</span>
          </div>
        </div>
          </div>
          <div className="flex items-center space-x-2">
        <Badge variant="secondary">{document.status}</Badge>
        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={saveDocument} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar
        </Button>
          </div>
        </div>

        {/* AI Toolbar Toggle */}
        <div>
          <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => setShowToolbar((prev) => !prev)}
        aria-expanded={showToolbar}
        aria-controls="ai-toolbar-panel"
          >
        <Sparkles className="w-4 h-4 mr-2" />
        Herramientas de IA
          </Button>
          {showToolbar && (
        <div
          id="ai-toolbar-panel"
          className="flex items-center space-x-2 p-2 border rounded-lg bg-gray-50 mt-3 animate-fade-in"
        >
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-gray-700">Asistente:</span>
            <Button variant="ghost" size="sm" onClick={() => handleAssistant("grammar")}>
          <CheckCircle className="w-4 h-4 mr-1" />
          Gramática
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleAssistant("explain")}>
          <MessageSquare className="w-4 h-4 mr-1" />
          Explicar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleAssistant("simple")}>
          <Wand2 className="w-4 h-4 mr-1" />
          Simplificar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleAssistant("complex")}>
          <Sparkles className="w-4 h-4 mr-1" />
          Complejizar
            </Button>
          </div>
          <div className="w-px h-6 bg-gray-300" />
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-gray-700">Productor:</span>
            <Button variant="ghost" size="sm" onClick={() => handleProducer("expand")}>
          <PlusCircle className="w-4 h-4 mr-1" />
          Expandir
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleProducer("generate")}>
          <FileText className="w-4 h-4 mr-1" />
          Generar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleProducer("scheme")}>
          <BookOpen className="w-4 h-4 mr-1" />
          Esquema
            </Button>
          </div>
        </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 relative">
        <div className="max-w-4xl mx-auto">
          <Textarea
            ref={editorRef}
            value={document.content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="min-h-[600px] text-lg leading-relaxed resize-none"
            style={{ fontFamily: "Georgia, serif" }}
            placeholder="Comienza a escribir tu documento aquí. Selecciona texto y usa las herramientas de IA para mejorar tu escritura..."
          />

          {/* AI Result Panel */}
          {showAI && (
            <Card className="absolute top-4 right-4 w-96 shadow-lg border-primary/20 max-h-96 overflow-y-auto">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-primary">Resultado IA</span>
                </div>

                {isAILoading ? (
                  <div className="flex items-center space-x-2 py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-gray-600">Procesando...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-700 mb-4 max-h-48 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans">{aiResult}</pre>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" onClick={applyAIResult} className="flex-1">
                        Aplicar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAI(false)}>
                        Cerrar
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
