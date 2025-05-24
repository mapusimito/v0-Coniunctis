"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Sparkles,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  ImageIcon,
  Save,
  Share,
  Loader2,
  Wand2,
  FileText,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Zap,
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
    title: "Untitled Document",
    content: "",
    project_tag: "General",
    progress_percentage: 0,
    status: "draft" as const,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState("")
  const [aiType, setAiType] = useState<"grammar" | "style" | "content" | "structure">("content")
  const [isAILoading, setIsAILoading] = useState(false)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [tempProgress, setTempProgress] = useState(0)
  const [selectedText, setSelectedText] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [grammarErrors, setGrammarErrors] = useState<any[]>([])
  const [showOutlineDialog, setShowOutlineDialog] = useState(false)
  const [outlineTopic, setOutlineTopic] = useState("")
  const [generatedOutline, setGeneratedOutline] = useState<string[]>([])
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (documentId && user) {
      loadDocument(documentId)
    } else if (user) {
      setDocument({
        id: "",
        title: "Untitled Document",
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
      if (editorRef.current) {
        editorRef.current.innerHTML = data.content || ""
        updateWordCount()
      }
    } catch (error) {
      console.error("Error loading document:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateWordCount = () => {
    if (editorRef.current) {
      const text = editorRef.current.textContent || ""
      const words = text.split(/\s+/).filter((word) => word.length > 0)
      setWordCount(words.length)
      setCharCount(text.length)
    }
  }

  const saveDocument = async (showProgressPrompt = false) => {
    if (!user) return

    setIsSaving(true)
    try {
      const content = editorRef.current?.innerHTML || ""

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

      if (showProgressPrompt) {
        setTempProgress(document.progress_percentage)
        setShowProgressDialog(true)
      }
    } catch (error) {
      console.error("Error saving document:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateProgress = async () => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({ progress_percentage: tempProgress })
        .eq("id", document.id)

      if (error) throw error

      setDocument((prev) => ({ ...prev, progress_percentage: tempProgress }))
      setShowProgressDialog(false)
    } catch (error) {
      console.error("Error updating progress:", error)
    }
  }

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateWordCount()
  }

  const handleAIAssist = async () => {
    const selection = window.getSelection()
    const text = selection?.toString() || editorRef.current?.textContent || ""

    if (!text.trim()) {
      setAiSuggestion("Please select some text or write something first for AI assistance.")
      setShowAI(true)
      return
    }

    setSelectedText(text)
    setIsAILoading(true)
    setShowAI(true)

    try {
      const response = await aiService.getSuggestion(text)
      setAiSuggestion(response.suggestion)
      setAiType(response.type)
    } catch (error) {
      setAiSuggestion("Sorry, AI assistance is temporarily unavailable. Please try again later.")
    } finally {
      setIsAILoading(false)
    }
  }

  const improveText = async () => {
    if (!selectedText) return

    setIsAILoading(true)
    try {
      const improvedText = await aiService.improveText(selectedText)

      // Replace selected text with improved version
      if (window.getSelection()?.rangeCount) {
        const range = window.getSelection()?.getRangeAt(0)
        if (range) {
          range.deleteContents()
          range.insertNode(document.createTextNode(improvedText))
        }
      }

      updateWordCount()
      setShowAI(false)
    } catch (error) {
      console.error("Error improving text:", error)
    } finally {
      setIsAILoading(false)
    }
  }

  const generateContent = async (type: "continue" | "expand" | "summarize") => {
    setIsAILoading(true)
    try {
      const content = await aiService.generateContent(editorRef.current?.textContent || "", type)

      // Insert generated content at cursor position
      if (editorRef.current) {
        const selection = window.getSelection()
        if (selection?.rangeCount) {
          const range = selection.getRangeAt(0)
          const newNode = document.createElement("p")
          newNode.innerHTML = content
          range.insertNode(newNode)
        }
      }

      updateWordCount()
      setShowAI(false)
    } catch (error) {
      console.error("Error generating content:", error)
    } finally {
      setIsAILoading(false)
    }
  }

  const generateTitle = async () => {
    const content = editorRef.current?.textContent || ""
    if (!content.trim()) return

    setIsAILoading(true)
    try {
      const title = await aiService.generateTitle(content)
      setDocument((prev) => ({ ...prev, title }))
    } catch (error) {
      console.error("Error generating title:", error)
    } finally {
      setIsAILoading(false)
    }
  }

  const checkGrammar = async () => {
    const text = editorRef.current?.textContent || ""
    if (!text.trim()) return

    setIsAILoading(true)
    try {
      const result = await aiService.checkGrammar(text)
      setGrammarErrors(result.errors)
    } catch (error) {
      console.error("Error checking grammar:", error)
    } finally {
      setIsAILoading(false)
    }
  }

  const generateOutline = async () => {
    if (!outlineTopic.trim()) return

    setIsAILoading(true)
    try {
      const outline = await aiService.generateOutline(outlineTopic)
      setGeneratedOutline(outline)
    } catch (error) {
      console.error("Error generating outline:", error)
    } finally {
      setIsAILoading(false)
    }
  }

  const insertOutline = () => {
    if (editorRef.current && generatedOutline.length > 0) {
      const outlineHTML = generatedOutline
        .map((point, index) => `<h${index === 0 ? "2" : "3"}>${point}</h${index === 0 ? "2" : "3"}>`)
        .join("")

      editorRef.current.innerHTML = outlineHTML + editorRef.current.innerHTML
      updateWordCount()
      setShowOutlineDialog(false)
      setOutlineTopic("")
      setGeneratedOutline([])
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="flex items-center space-x-2">
              <Input
                value={document.title}
                onChange={(e) => setDocument((prev) => ({ ...prev, title: e.target.value }))}
                className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0"
                placeholder="Document title..."
              />
              <Button variant="ghost" size="sm" onClick={generateTitle} disabled={isAILoading}>
                <Zap className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="project-tag" className="text-sm">
                  Project:
                </Label>
                <Select
                  value={document.project_tag}
                  onValueChange={(value) => setDocument((prev) => ({ ...prev, project_tag: value }))}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                    <SelectItem value="Blog">Blog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-sm">Progress:</Label>
                <Badge variant="outline">{document.progress_percentage}%</Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{wordCount} words</span>
                <span>{charCount} characters</span>
                {grammarErrors.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {grammarErrors.length} grammar issues
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{document.status}</Badge>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={() => saveDocument(true)}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>

        {/* Enhanced Toolbar */}
        <div className="flex items-center space-x-1 p-2 border rounded-lg bg-gray-50">
          <Button variant="ghost" size="sm" onClick={() => formatText("bold")}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatText("italic")}>
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatText("underline")}>
            <Underline className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <Button variant="ghost" size="sm" onClick={() => formatText("justifyLeft")}>
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatText("justifyCenter")}>
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatText("justifyRight")}>
            <AlignRight className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <Button variant="ghost" size="sm" onClick={() => formatText("insertUnorderedList")}>
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatText("insertOrderedList")}>
            <ListOrdered className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <Button variant="ghost" size="sm" onClick={() => formatText("createLink", prompt("Enter URL:") || "")}>
            <Link className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <ImageIcon className="w-4 h-4" />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => setShowOutlineDialog(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Outline
          </Button>
          <Button variant="ghost" size="sm" onClick={checkGrammar} disabled={isAILoading}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Grammar
          </Button>
          <Button variant="ghost" size="sm" onClick={handleAIAssist} className="text-primary hover:text-primary/80">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Assist
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 p-6 relative">
        <div className="max-w-4xl mx-auto">
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[600px] p-6 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-lg leading-relaxed"
            style={{ fontFamily: "Georgia, serif" }}
            onInput={() => {
              updateWordCount()
              clearTimeout(window.autoSaveTimeout)
              window.autoSaveTimeout = setTimeout(() => saveDocument(false), 30000)
            }}
            suppressContentEditableWarning={true}
          >
            {!document.content && (
              <p className="text-gray-400">
                Start writing your document here. Use the toolbar above for formatting, or select text and click AI
                Assist for suggestions...
              </p>
            )}
          </div>

          {/* Grammar Errors Display */}
          {grammarErrors.length > 0 && (
            <Card className="mt-4 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Grammar Suggestions</span>
                </div>
                <div className="space-y-2">
                  {grammarErrors.slice(0, 3).map((error, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-red-600">"{error.text}"</span>
                      <span className="text-gray-600"> → </span>
                      <span className="text-green-600">"{error.suggestion}"</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced AI Assistant Popup */}
          {showAI && (
            <Card className="absolute top-4 right-4 w-96 shadow-lg border-primary/20 max-h-96 overflow-y-auto">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-primary">AI Assistant</span>
                  <Badge variant="outline" className="text-xs">
                    {aiType}
                  </Badge>
                </div>

                {isAILoading ? (
                  <div className="flex items-center space-x-2 py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-gray-600">Analyzing your text...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 mb-4">{aiSuggestion}</p>

                    <Tabs defaultValue="suggestions" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                        <TabsTrigger value="generate">Generate</TabsTrigger>
                      </TabsList>

                      <TabsContent value="suggestions" className="space-y-2 mt-3">
                        <Button size="sm" onClick={improveText} className="w-full" disabled={!selectedText}>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Improve Selected Text
                        </Button>
                        <Button size="sm" onClick={handleAIAssist} variant="outline" className="w-full">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Get New Suggestion
                        </Button>
                        <Button size="sm" onClick={checkGrammar} variant="outline" className="w-full">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Check Grammar
                        </Button>
                      </TabsContent>

                      <TabsContent value="generate" className="space-y-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => generateContent("continue")}
                          variant="outline"
                          className="w-full"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Continue Writing
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => generateContent("expand")}
                          variant="outline"
                          className="w-full"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Expand Ideas
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => generateContent("summarize")}
                          variant="outline"
                          className="w-full"
                        >
                          <List className="w-4 h-4 mr-2" />
                          Summarize
                        </Button>
                      </TabsContent>
                    </Tabs>

                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => setShowAI(false)} className="flex-1">
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Outline Generator Dialog */}
      <Dialog open={showOutlineDialog} onOpenChange={setShowOutlineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Document Outline</DialogTitle>
            <DialogDescription>
              Enter a topic and AI will generate a structured outline for your document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="outline-topic">Topic or Title</Label>
              <Textarea
                id="outline-topic"
                placeholder="e.g., The Impact of AI on Modern Education"
                value={outlineTopic}
                onChange={(e) => setOutlineTopic(e.target.value)}
              />
            </div>

            {generatedOutline.length > 0 && (
              <div className="space-y-2">
                <Label>Generated Outline:</Label>
                <div className="border rounded-lg p-3 bg-gray-50">
                  {generatedOutline.map((point, index) => (
                    <div key={index} className="py-1">
                      <span className="font-medium">
                        {index + 1}. {point}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              {generatedOutline.length === 0 ? (
                <Button onClick={generateOutline} disabled={!outlineTopic.trim() || isAILoading} className="flex-1">
                  {isAILoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BookOpen className="w-4 h-4 mr-2" />
                  )}
                  Generate Outline
                </Button>
              ) : (
                <>
                  <Button onClick={insertOutline} className="flex-1">
                    Insert Outline
                  </Button>
                  <Button variant="outline" onClick={generateOutline} disabled={isAILoading}>
                    Regenerate
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setShowOutlineDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Update Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Project Progress</DialogTitle>
            <DialogDescription>How much progress have you made on this project?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="progress">Progress Percentage</Label>
              <Select value={tempProgress.toString()} onValueChange={(value) => setTempProgress(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 21 }, (_, i) => i * 5).map((value) => (
                    <SelectItem key={value} value={value.toString()}>
                      {value}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={updateProgress} className="flex-1">
                Update Progress
              </Button>
              <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
