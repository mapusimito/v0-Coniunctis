"use client"

import { $getRoot, $getSelection } from "lexical"
import { useEffect, useRef } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { TRANSFORMERS } from "@lexical/markdown"
import { $convertFromMarkdownString, $convertToMarkdownString } from "@lexical/markdown"

import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListItemNode, ListNode } from "@lexical/list"
import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { $createParagraphNode, $createTextNode, type EditorState } from "lexical"

import { EditorToolbar } from "./editor-toolbar"

const theme = {
  ltr: "ltr",
  rtl: "rtl",
  placeholder: "text-gray-400",
  paragraph: "mb-1",
  quote: "border-l-4 border-gray-300 pl-4 italic text-gray-600",
  heading: {
    h1: "text-3xl font-bold mb-4",
    h2: "text-2xl font-bold mb-3",
    h3: "text-xl font-bold mb-2",
    h4: "text-lg font-bold mb-2",
    h5: "text-base font-bold mb-1",
    h6: "text-sm font-bold mb-1",
  },
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal list-inside",
    ul: "list-disc list-inside",
    listitem: "mb-1",
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "bg-gray-100 px-1 py-0.5 rounded text-sm font-mono",
  },
  code: "bg-gray-100 p-4 rounded-lg font-mono text-sm",
  codeHighlight: {
    atrule: "text-purple-600",
    attr: "text-blue-600",
    boolean: "text-orange-600",
    builtin: "text-purple-600",
    cdata: "text-gray-600",
    char: "text-green-600",
    class: "text-blue-600",
    "class-name": "text-blue-600",
    comment: "text-gray-500",
    constant: "text-orange-600",
    deleted: "text-red-600",
    doctype: "text-gray-600",
    entity: "text-orange-600",
    function: "text-purple-600",
    important: "text-red-600",
    inserted: "text-green-600",
    keyword: "text-purple-600",
    namespace: "text-blue-600",
    number: "text-orange-600",
    operator: "text-gray-700",
    prolog: "text-gray-600",
    property: "text-blue-600",
    punctuation: "text-gray-700",
    regex: "text-green-600",
    selector: "text-green-600",
    string: "text-green-600",
    symbol: "text-orange-600",
    tag: "text-red-600",
    url: "text-blue-600",
    variable: "text-orange-600",
  },
}

function onError(error: Error) {
  console.error(error)
}

interface LexicalEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  onSelectionChange?: (selectedText: string) => void
}

function EditorContent({ content, onChange, onSelectionChange }: LexicalEditorProps) {
  const [editor] = useLexicalComposerContext()
  const isFirstRender = useRef(true)

  // Inicializar contenido desde markdown
  useEffect(() => {
    if (isFirstRender.current) {
      editor.update(() => {
        const root = $getRoot()
        root.clear()

        if (content && content.trim()) {
          try {
            // Convertir markdown a nodos de Lexical
            $convertFromMarkdownString(content, TRANSFORMERS)
          } catch (error) {
            console.error("Error parsing markdown:", error)
            // Fallback a texto plano si falla el parsing de markdown
            const paragraphs = content.split("\n\n")
            paragraphs.forEach((paragraph) => {
              if (paragraph.trim()) {
                const paragraphNode = $createParagraphNode()
                const textNode = $createTextNode(paragraph.trim())
                paragraphNode.append(textNode)
                root.append(paragraphNode)
              }
            })
          }
        }
      })
      isFirstRender.current = false
    }
  }, [editor, content])

  // Manejar cambios de contenido y convertir a markdown
  const handleEditorChange = (editorState: EditorState) => {
    editorState.read(() => {
      try {
        // Convertir el estado del editor a markdown
        const markdownContent = $convertToMarkdownString(TRANSFORMERS)
        onChange(markdownContent)
      } catch (error) {
        console.error("Error converting to markdown:", error)
        // Fallback a texto plano si falla la conversión
        const root = $getRoot()
        const textContent = root.getTextContent()
        onChange(textContent)
      }

      // Manejar selección de texto
      if (onSelectionChange) {
        const selection = $getSelection()
        if (selection) {
          const selectedText = selection.getTextContent()
          onSelectionChange(selectedText)
        }
      }
    })
  }

  const insertAIContent = (content: string) => {
    editor.update(() => {
      const selection = $getSelection()
      if (selection) {
        selection.insertText(content)
      } else {
        const root = $getRoot()
        const paragraph = $createParagraphNode()
        const textNode = $createTextNode(content)
        paragraph.append(textNode)
        root.append(paragraph)
      }
    })
  }

  useEffect(() => {
    if (onSelectionChange) {
      // Exponer la función insertAIContent al componente padre
      ;(window as any).insertAIContent = insertAIContent
    }
  }, [editor])

  return (
    <>
      <EditorToolbar />
      <div className="relative flex-1">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="min-h-[600px] p-6 text-lg leading-relaxed resize-none outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              style={{ fontFamily: "Georgia, serif" }}
            />
          }
          placeholder={
            <div
              className="absolute top-6 left-6 text-gray-400 pointer-events-none text-lg"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Comienza a escribir tu documento aquí. Selecciona texto y usa las herramientas de IA para mejorar tu
              escritura...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={handleEditorChange} />
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <TabIndentationPlugin />
        <AutoFocusPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      </div>
    </>
  )
}

export function LexicalEditor({ content, onChange, placeholder, onSelectionChange }: LexicalEditorProps) {
  const initialConfig = {
    namespace: "ConiunctisEditor",
    theme,
    onError,
    nodes: [HeadingNode, ListNode, ListItemNode, QuoteNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode],
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="flex flex-col h-full border rounded-lg">
        <EditorContent
          content={content}
          onChange={onChange}
          placeholder={placeholder}
          onSelectionChange={onSelectionChange}
        />
      </div>
    </LexicalComposer>
  )
}
