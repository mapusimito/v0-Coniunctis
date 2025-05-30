"use client"

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND, $getRoot } from "lexical"
import { $createHeadingNode, $isHeadingNode, type HeadingTagType } from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import { $createParagraphNode, $isParagraphNode } from "lexical"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bold, Italic, Underline, Strikethrough, Undo, Redo, Trash2 } from "lucide-react"

// Nuevo hook para detectar móvil
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return isMobile
}

const LowPriority = 1

export function EditorToolbar() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [blockType, setBlockType] = useState("paragraph")
  const isMobile = useIsMobile()

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"))
      setIsItalic(selection.hasFormat("italic"))
      setIsUnderline(selection.hasFormat("underline"))
      setIsStrikethrough(selection.hasFormat("strikethrough"))

      const anchorNode = selection.anchor.getNode()
      const element = anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow()

      if ($isHeadingNode(element)) {
        setBlockType(element.getTag())
      } else if ($isParagraphNode(element)) {
        setBlockType("paragraph")
      }
    }
  }, [])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar()
      })
    })
  }, [editor, updateToolbar])

  useEffect(() => {
    return editor.registerCommand(
      UNDO_COMMAND,
      () => {
        setCanUndo(editor.getEditorState().read(() => editor.getEditorState()._nodeMap.size > 1))
        return false
      },
      LowPriority,
    )
  }, [editor])

  useEffect(() => {
    return editor.registerCommand(
      REDO_COMMAND,
      () => {
        setCanRedo(editor.getEditorState().read(() => editor.getEditorState()._nodeMap.size > 1))
        return false
      },
      LowPriority,
    )
  }, [editor])

  const formatText = (format: "bold" | "italic" | "underline" | "strikethrough") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  const formatHeading = (headingSize: HeadingTagType | "paragraph") => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          if (headingSize === "paragraph") {
            $setBlocksType(selection, () => $createParagraphNode())
          } else {
            $setBlocksType(selection, () => $createHeadingNode(headingSize))
          }
        }
      })
    }
  }

  const clearEditor = () => {
    editor.update(() => {
      const root = $getRoot()
      root.clear()
      const paragraph = $createParagraphNode()
      root.append(paragraph)
      paragraph.select()
    })
  }

  // Toolbar siempre arriba, más compacta en móvil y sin deshacer/rehacer
  return (
    <div
      className={`flex items-center gap-2 border-b border-border bg-card ${
        isMobile ? "p-1 sticky top-0 z-10" : "p-2"
      }`}
    >
      {/* Selector de encabezados */}
      <Select value={blockType} onValueChange={formatHeading}>
        <SelectTrigger className={`${isMobile ? "w-16 h-8 text-xs" : "w-36 h-9"} bg-background border-border rounded-lg`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card border-border rounded-lg">
          <SelectItem value="paragraph">Párrafo</SelectItem>
          <SelectItem value="h1">Título 1</SelectItem>
          <SelectItem value="h2">Título 2</SelectItem>
          <SelectItem value="h3">Título 3</SelectItem>
          <SelectItem value="h4">Título 4</SelectItem>
          <SelectItem value="h5">Título 5</SelectItem>
          <SelectItem value="h6">Título 6</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 bg-border" />

      {/* Formato de texto */}
      <div className="flex items-center gap-1">
        <Button
          variant={isBold ? "default" : "ghost"}
          size={isMobile ? "icon" : "sm"}
          onClick={() => formatText("bold")}
          className={`${isMobile ? "h-8 w-8" : "h-9 w-9"} p-0 hover:bg-muted rounded-lg`}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={isItalic ? "default" : "ghost"}
          size={isMobile ? "icon" : "sm"}
          onClick={() => formatText("italic")}
          className={`${isMobile ? "h-8 w-8" : "h-9 w-9"} p-0 hover:bg-muted rounded-lg`}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={isUnderline ? "default" : "ghost"}
          size={isMobile ? "icon" : "sm"}
          onClick={() => formatText("underline")}
          className={`${isMobile ? "h-8 w-8" : "h-9 w-9"} p-0 hover:bg-muted rounded-lg`}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant={isStrikethrough ? "default" : "ghost"}
          size={isMobile ? "icon" : "sm"}
          onClick={() => formatText("strikethrough")}
          className={`${isMobile ? "h-8 w-8" : "h-9 w-9"} p-0 hover:bg-muted rounded-lg`}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 bg-border" />

      {/* Limpiar todo */}
      <Button
        variant="ghost"
        size={isMobile ? "icon" : "sm"}
        onClick={clearEditor}
        className={`${isMobile ? "h-8 w-8" : "h-9 w-9"} p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
