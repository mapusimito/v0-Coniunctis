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

import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListItemNode, ListNode } from "@lexical/list"
import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { $createParagraphNode, $createTextNode, type EditorState } from "lexical"

import { EditorToolbar } from "./editor-toolbar"

const theme = {
  ltr: "ltr",
  rtl: "rtl",
  placeholder: "text-muted-foreground",
  paragraph: "mb-2",
  quote: "border-l-4 border-primary/30 pl-4 italic text-muted-foreground bg-muted/30 py-2 rounded-r-lg",
  heading: {
    h1: "text-3xl font-bold mb-4 text-foreground",
    h2: "text-2xl font-bold mb-3 text-foreground",
    h3: "text-xl font-bold mb-2 text-foreground",
    h4: "text-lg font-bold mb-2 text-foreground",
    h5: "text-base font-bold mb-1 text-foreground",
    h6: "text-sm font-bold mb-1 text-foreground",
  },
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal list-inside space-y-1",
    ul: "list-disc list-inside space-y-1",
    listitem: "mb-1",
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "bg-muted px-2 py-1 rounded text-sm font-mono text-foreground",
  },
  code: "bg-muted p-4 rounded-xl font-mono text-sm text-foreground border border-border",
  codeHighlight: {
    atrule: "text-purple-600 dark:text-purple-400",
    attr: "text-blue-600 dark:text-blue-400",
    boolean: "text-orange-600 dark:text-orange-400",
    builtin: "text-purple-600 dark:text-purple-400",
    cdata: "text-muted-foreground",
    char: "text-green-600 dark:text-green-400",
    class: "text-blue-600 dark:text-blue-400",
    "class-name": "text-blue-600 dark:text-blue-400",
    comment: "text-muted-foreground",
    constant: "text-orange-600 dark:text-orange-400",
    deleted: "text-red-600 dark:text-red-400",
    doctype: "text-muted-foreground",
    entity: "text-orange-600 dark:text-orange-400",
    function: "text-purple-600 dark:text-purple-400",
    important: "text-red-600 dark:text-red-400",
    inserted: "text-green-600 dark:text-green-400",
    keyword: "text-purple-600 dark:text-purple-400",
    namespace: "text-blue-600 dark:text-blue-400",
    number: "text-orange-600 dark:text-orange-400",
    operator: "text-foreground",
    prolog: "text-muted-foreground",
    property: "text-blue-600 dark:text-blue-400",
    punctuation: "text-foreground",
    regex: "text-green-600 dark:text-green-400",
    selector: "text-green-600 dark:text-green-400",
    string: "text-green-600 dark:text-green-400",
    symbol: "text-orange-600 dark:text-orange-400",
    tag: "text-red-600 dark:text-red-400",
    url: "text-blue-600 dark:text-blue-400",
    variable: "text-orange-600 dark:text-orange-400",
  },
}

function onError(error: Error) {
  console.error(error)
}

interface LexicalEditorProps {
  content: string
  editorState?: string
  onChange: (content: string, editorState: string) => void
  placeholder?: string
  onSelectionChange?: (selectedText: string) => void
}

function EditorContent({ content, editorState, onChange, onSelectionChange }: LexicalEditorProps) {
  const [editor] = useLexicalComposerContext()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current && (editorState || content)) {
      editor.update(() => {
        const root = $getRoot()
        root.clear()

        try {
          if (editorState && editorState.trim()) {
            const parsedState = editor.parseEditorState(editorState)
            editor.setEditorState(parsedState)
            return
          }

          if (content && content.trim()) {
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
        } catch (error) {
          console.error("Error loading editor state:", error)
          if (content && content.trim()) {
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
  }, [editor, content, editorState])

  const handleEditorChange = (editorState: EditorState) => {
    editorState.read(() => {
      try {
        const root = $getRoot()
        const textContent = root.getTextContent()
        const serializedState = JSON.stringify(editorState.toJSON())
        onChange(textContent, serializedState)

        if (onSelectionChange) {
          const selection = $getSelection()
          if (selection) {
            const selectedText = selection.getTextContent()
            onSelectionChange(selectedText)
          }
        }
      } catch (error) {
        console.error("Error serializing editor state:", error)
        const root = $getRoot()
        const textContent = root.getTextContent()
        onChange(textContent, "")
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
    ;(window as any).insertAIContent = insertAIContent
  }, [editor])

  return (
    <>
      <EditorToolbar />
      <div className="relative flex-1">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="min-h-[600px] p-8 text-lg leading-relaxed resize-none outline-none bg-background text-foreground focus-modern"
              style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            />
          }
          placeholder={
            <div
              className="absolute top-8 left-8 text-muted-foreground pointer-events-none text-lg"
              style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
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

export function LexicalEditor({ content, editorState, onChange, placeholder, onSelectionChange }: LexicalEditorProps) {
  const initialConfig = {
    namespace: "ConiunctisEditor",
    theme,
    onError,
    nodes: [HeadingNode, ListNode, ListItemNode, QuoteNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode],
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="flex flex-col h-full modern-card">
        <EditorContent
          content={content}
          editorState={editorState}
          onChange={onChange}
          placeholder={placeholder}
          onSelectionChange={onSelectionChange}
        />
      </div>
    </LexicalComposer>
  )
}
