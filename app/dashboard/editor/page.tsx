"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Share2,
  Lock,
  Eye,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { AIService } from "@/lib/ai-service"
import { LexicalEditor } from "@/components/lexical-editor"
import { ShareDocumentModal } from "@/components/share-document-modal"
import { SharingService } from "@/lib/sharing-service"
import { useToast } from "@/hooks/use-toast"

export default function EditorPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentId = searchParams.get("id")
  const aiService = AIService.getInstance()
  const sharingService = SharingService.getInstance()
  const { toast } = useToast()

  const [document, setDocument] = useState({
    id: "",
    title: "Documento sin título",
    content: "",
    plain_text: "",
    project_tag: "General",
    progress_percentage: 0,
    status: "draft" as const,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [aiResult, setAiResult] = useState("")
  const [isAILoading, setIsAILoading] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [lastSavedContent, setLastSavedContent] = useState("")
  const [permission, setPermission] = useState<"owner" | "edit" | "view" | null>(null)
  const [isOwner, setIsOwner] = useState(true)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (documentId && user) {
      loadDocument(documentId)
    } else if (user) {
      setDocument({
        id: "",
        title: "Documento sin título",
        content: "",
        plain_text: "",
        project_tag: "General",
        progress_percentage: 0,
        status: "draft",
      })
      setPermission("owner")
      setIsOwner(true)
    }
  }, [documentId, user])

  const loadDocument = async (id: string) => {
    setIsLoading(true)
    try {
      // Cargar documento
      const { data, error } = await supabase.from("documents").select("*").eq("id", id).single()

      if (error) throw error

      // Verificar permisos
      const userPermission = await sharingService.getDocumentPermission(id)
      setPermission(userPermission)
      setIsOwner(userPermission === "owner")

      if (!userPermission) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para acceder a este documento",
          variant: "destructive",
        })
        router.push("/dashboard/documents")
        return
      }

      let editorState = ""
      let plainText = ""

      try {
        const parsed = JSON.parse(data.content || "{}")
        if (parsed.root && parsed.root.children) {
          editorState = data.content
          plainText = extractPlainTextFromState(parsed)
        } else {
          throw new Error("Not a valid editor state")
        }
      } catch {
        plainText = data.content || ""
        editorState = ""
      }

      setDocument({
        ...data,
        content: editorState,
        plain_text: plainText,
      })
      updateWordCount(plainText)
    } catch (error) {
      console.error("Error loading document:", error)
      toast({
        title: "Error",
        description: "Error al cargar el documento",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const extractPlainTextFromState = (state: any): string => {
    try {
      if (!state.root || !state.root.children) return ""

      const extractTextFromNode = (node: any): string => {
        if (node.type === "text") {
          return node.text || ""
        }
        if (node.children && Array.isArray(node.children)) {
          return node.children.map(extractTextFromNode).join("")
        }
        return ""
      }

      return state.root.children.map(extractTextFromNode).join("\n").trim()
    } catch {
      return ""
    }
  }

  const updateWordCount = (text: string) => {
    const words = text.split(/\s+/).filter((word) => word.length > 0)
    setWordCount(words.length)
    setCharCount(text.length)
  }

  const saveDocument = async () => {
    if (!user || permission === "view") return

    setIsSaving(true)
    try {
      console.log("Saving document:", {
        id: document.id,
        title: document.title,
        userId: user.id,
      })

      const documentData = {
        title: document.title,
        content: document.content || document.plain_text,
        word_count: wordCount,
        project_tag: document.project_tag,
        progress_percentage: document.progress_percentage,
        status: document.status,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }

      if (document.id) {
        console.log("Updating existing document...")
        const { error } = await supabase.from("documents").update(documentData).eq("id", document.id)

        if (error) {
          console.error("Update error:", error)
          throw error
        }
        console.log("Document updated successfully")
      } else {
        console.log("Creating new document...")
        const { data, error } = await supabase.from("documents").insert(documentData).select().single()

        if (error) {
          console.error("Insert error:", error)
          throw error
        }
        console.log("Document created successfully:", data.id)
        setDocument((prev) => ({ ...prev, id: data.id }))
        router.replace(`/dashboard/editor?id=${data.id}`)
      }

      setLastSavedContent(document.content)
      toast({
        title: "Éxito",
        description: "Documento guardado correctamente",
      })
    } catch (error) {
      console.error("Error saving document:", error)
      toast({
        title: "Error",
        description: `Error al guardar el documento: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleContentChange = (plainText: string, editorState: string) => {
    if (permission === "view") return // No permitir edición en modo solo lectura

    setDocument((prev) => ({
      ...prev,
      content: editorState,
      plain_text: plainText,
    }))
    updateWordCount(plainText)
  }

  const handleSelectionChange = (selectedText: string) => {
    setSelectedText(selectedText)
  }

  const handleAssistant = async (action: "grammar" | "explain" | "simple" | "complex") => {
    const text = selectedText || document.plain_text
    if (!text.trim()) {
      setAiResult("Por favor selecciona texto o escribe algo primero.")
      setShowAI(true)
      return
    }

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
    const text = action === "scheme" ? document.title : selectedText || document.plain_text
    if (!text.trim()) {
      setAiResult("Por favor proporciona texto o un tema.")
      setShowAI(true)
      return
    }

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
    if (!document.plain_text.trim() || permission === "view") return

    setIsAILoading(true)
    try {
      const title = await aiService.generateTitle(document.plain_text)
      setDocument((prev) => ({ ...prev, title }))
    } catch (error) {
      console.error("Error generating title:", error)
    } finally {
      setIsAILoading(false)
    }
  }

  const applyAIResult = () => {
    if (permission === "view") return // No permitir aplicar en modo solo lectura

    if ((window as any).insertAIContent) {
      if (selectedText) {
        ;(window as any).insertAIContent(aiResult)
      } else {
        ;(window as any).insertAIContent("\n\n" + aiResult)
      }
    } else {
      if (selectedText) {
        const newContent = document.plain_text.replace(selectedText, aiResult)
        setDocument((prev) => ({ ...prev, plain_text: newContent }))
        updateWordCount(newContent)
      } else {
        const newContent = document.plain_text + "\n\n" + aiResult
        setDocument((prev) => ({ ...prev, plain_text: newContent }))
        updateWordCount(newContent)
      }
    }
    setShowAI(false)
  }

  // Autoguardado solo si tiene permisos de edición
  useEffect(() => {
    if (!user || permission === "view") return

    autoSaveIntervalRef.current = setInterval(() => {
      if (document.content !== lastSavedContent) {
        saveDocument()
      }
    }, 15000)

    return () => {
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current)
    }
  }, [document.content, user, permission])

  const getPermissionBadge = () => {
    switch (permission) {
      case "owner":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Propietario
          </Badge>
        )
      case "edit":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Puede editar
          </Badge>
        )
      case "view":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Solo lectura
          </Badge>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando documento...</p>
        </div>
      </div>
    )
  }

  const isReadOnly = permission === "view"

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="modern-header border-b p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="flex items-center space-x-3">
              {isReadOnly && <Lock className="w-5 h-5 text-muted-foreground" />}
              <Input
                value={document.title}
                onChange={(e) => !isReadOnly && setDocument((prev) => ({ ...prev, title: e.target.value }))}
                className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                placeholder="Título del documento..."
                readOnly={isReadOnly}
              />
              {!isReadOnly && (
                <Button variant="ghost" size="sm" onClick={generateTitle} disabled={isAILoading} className="rounded-lg">
                  <Zap className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-6 mt-3">
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium text-muted-foreground">Proyecto:</Label>
                <Select
                  value={document.project_tag}
                  onValueChange={(value) => !isReadOnly && setDocument((prev) => ({ ...prev, project_tag: value }))}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="w-32 h-8 rounded-lg">
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
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{wordCount} palabras</span>
                <span>{charCount} caracteres</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getPermissionBadge()}
            {document.id && (
              <Button variant="outline" size="sm" onClick={() => setShowShareModal(true)} className="rounded-lg">
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            )}
            {!isReadOnly && (
              <Button size="sm" className="modern-button-primary" onClick={saveDocument} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar
              </Button>
            )}
          </div>
        </div>

        {/* AI Toolbar Toggle - Solo si puede editar */}
        {!isReadOnly && (
          <div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
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
                className="flex items-center space-x-2 p-4 border border-border rounded-xl bg-card mt-4 animate-fade-in"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">Asistente:</span>
                  <Button variant="ghost" size="sm" onClick={() => handleAssistant("grammar")} className="rounded-lg">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Gramática
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleAssistant("explain")} className="rounded-lg">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Explicar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleAssistant("simple")} className="rounded-lg">
                    <Wand2 className="w-4 h-4 mr-1" />
                    Simplificar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleAssistant("complex")} className="rounded-lg">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Complejizar
                  </Button>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">Productor:</span>
                  <Button variant="ghost" size="sm" onClick={() => handleProducer("expand")} className="rounded-lg">
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Expandir
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleProducer("generate")} className="rounded-lg">
                    <FileText className="w-4 h-4 mr-1" />
                    Generar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleProducer("scheme")} className="rounded-lg">
                    <BookOpen className="w-4 h-4 mr-1" />
                    Esquema
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de solo lectura */}
        {isReadOnly && (
          <div className="flex items-center space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <Eye className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700 dark:text-orange-300">
              Este documento está en modo solo lectura. No puedes realizar cambios.
            </span>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <div className="h-full">
          <LexicalEditor
            content={document.plain_text}
            editorState={document.content}
            onChange={handleContentChange}
            onSelectionChange={handleSelectionChange}
            readOnly={isReadOnly}
          />

          {/* AI Result Panel - Solo si puede editar */}
          {showAI && !isReadOnly && (
            <Card className="absolute top-4 right-4 w-96 shadow-modern-lg border-primary/20 max-h-96 overflow-y-auto modern-card animate-scale-in">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-foreground">Resultado de ConiunctisIA</span>
                </div>

                {isAILoading ? (
                  <div className="flex items-center space-x-2 py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Procesando...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-foreground mb-4 max-h-48 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans">{aiResult}</pre>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" onClick={applyAIResult} className="flex-1 modern-button-primary">
                        Aplicar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAI(false)} className="rounded-lg">
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

      {/* Modal de compartir */}
      <ShareDocumentModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        documentId={document.id}
        documentTitle={document.title}
        isOwner={isOwner}
      />
    </div>
  )
}
