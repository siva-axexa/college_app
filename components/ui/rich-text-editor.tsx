"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Label } from "@/components/ui/label"
import { commands as mdCommands } from "@uiw/react-md-editor"

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  id?: string
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter content...",
  label,
  id 
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="border rounded-md p-3 bg-gray-50 animate-pulse min-h-[200px]">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="rich-text-editor border rounded-md overflow-hidden">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || "")}
          data-color-mode="dark"
          preview="edit"
          hideToolbar={false}
          height={300}
          style={{
            backgroundColor: '#1a1a1a',
          }}
          textareaProps={{
            placeholder: placeholder,
            style: {
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: 'inherit',
              backgroundColor: '#1a1a1a',
              color: '#ffffff'
            }
          }}
          commands={[
            mdCommands.bold,
            mdCommands.italic,
            mdCommands.divider,
            mdCommands.unorderedListCommand,
            mdCommands.orderedListCommand,
            mdCommands.link,
          ]}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Use toolbar buttons or Markdown: **bold**, *italic*, [link](url), - bullet points, 1. numbered list
      </p>
      <style jsx global>{`
        /* Main editor container - Dark theme */
        .rich-text-editor .w-md-editor {
          background-color: #1a1a1a !important;
          border: 1px solid #404040 !important;
        }
        
        /* Text area container */
        .rich-text-editor .w-md-editor-text-container {
          background-color: #1a1a1a !important;
        }
        
        /* Text area - White text on dark background */
        .rich-text-editor .w-md-editor-text {
          color: #ffffff !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
          background-color: #1a1a1a !important;
          font-family: inherit !important;
        }
        
        .rich-text-editor .w-md-editor-text-container .w-md-editor-text {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
        }
        
        /* Toolbar - Dark theme */
        .rich-text-editor .w-md-editor-toolbar {
          background-color: #2d2d2d !important;
          border-bottom: 1px solid #404040 !important;
        }
        
        /* Toolbar buttons */
        .rich-text-editor .w-md-editor-toolbar li button {
          color: #ffffff !important;
        }
        
        .rich-text-editor .w-md-editor-toolbar li button:hover {
          background-color: #404040 !important;
          color: #ffffff !important;
        }
        
        .rich-text-editor .w-md-editor-toolbar li button.active {
          background-color: #0d6efd !important;
          color: #ffffff !important;
        }
        
        /* Focus state */
        .rich-text-editor .w-md-editor.w-md-editor-focus {
          border-color: #0d6efd !important;
          box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.2) !important;
        }
        
        /* Placeholder text */
        .rich-text-editor .w-md-editor-text::placeholder {
          color: #999999 !important;
        }
        
        /* Divider in toolbar */
        .rich-text-editor .w-md-editor-toolbar li.w-md-editor-toolbar-divider {
          border-color: #404040 !important;
        }
        
        /* Remove any conflicting light theme styles */
        .rich-text-editor [data-color-mode="dark"] .w-md-editor {
          background-color: #1a1a1a !important;
        }
        
        .rich-text-editor [data-color-mode="dark"] .w-md-editor-text {
          color: #ffffff !important;
          background-color: #1a1a1a !important;
        }
        
        .rich-text-editor [data-color-mode="dark"] .w-md-editor-toolbar {
          background-color: #2d2d2d !important;
        }
      `}</style>
    </div>
  )
}
