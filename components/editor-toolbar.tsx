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

const LowPriority = 1

export function EditorToolbar() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [blockType, setBlockType] = useState("paragraph")
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      // Actualizar estados de formato
      setIsBold(selection.hasFormat("bold"))
      setIsItalic(selection.hasFormat("italic"))
      setIsUnderline(selection.hasFormat("underline"))
      setIsStrikethrough(selection.hasFormat("strikethrough"))

      // Actualizar tipo de bloque
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

  const undo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined)
  }

  const redo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined)
  }

  return (
    <div className="flex items-center gap-2 p-3 border-b bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      {/* Deshacer/Rehacer */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 bg-gray-300 dark:bg-gray-600" />

      {/* Selector de encabezados */}
      <Select value={blockType} onValueChange={formatHeading}>
        <SelectTrigger className="w-32 h-8 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
          <SelectItem value="paragraph">Párrafo</SelectItem>
          <SelectItem value="h1">Título 1</SelectItem>
          <SelectItem value="h2">Título 2</SelectItem>
          <SelectItem value="h3">Título 3</SelectItem>
          <SelectItem value="h4">Título 4</SelectItem>
          <SelectItem value="h5">Título 5</SelectItem>
          <SelectItem value="h6">Título 6</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 bg-gray-300 dark:bg-gray-600" />

      {/* Formato de texto */}
      <div className="flex items-center gap-1">
        <Button
          variant={isBold ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText("bold")}
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={isItalic ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText("italic")}
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={isUnderline ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText("underline")}
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant={isStrikethrough ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText("strikethrough")}
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 bg-gray-300 dark:bg-gray-600" />

      {/* Limpiar todo */}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearEditor}
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
