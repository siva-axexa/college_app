"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Label } from "@/components/ui/label"

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
          data-color-mode="light"
          preview="edit"
          hideToolbar={false}
          height={200}
          style={{
            backgroundColor: '#f8f9fa',
          }}
          textareaProps={{
            placeholder: placeholder,
            style: {
              fontSize: '14px',
              lineHeight: '1.5',
              fontFamily: 'inherit',
              backgroundColor: '#f8f9fa',
              color: '#212529'
            }
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Supports Markdown formatting: **bold**, *italic*, [links](url), lists, and more
      </p>
      <style jsx global>{`
        .rich-text-editor .w-md-editor {
          background-color: #f8f9fa !important;
          border: 1px solid #dee2e6 !important;
        }
        .rich-text-editor .w-md-editor-text-container {
          background-color: #f8f9fa !important;
        }
        .rich-text-editor .w-md-editor-text {
          color: #212529 !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          background-color: #f8f9fa !important;
        }
        .rich-text-editor .w-md-editor-text-container .w-md-editor-text {
          background-color: #f8f9fa !important;
        }
        .rich-text-editor .w-md-editor-toolbar {
          background-color: #e9ecef !important;
          border-bottom: 1px solid #dee2e6 !important;
        }
        .rich-text-editor .w-md-editor-toolbar li button {
          color: #212529 !important;
        }
        .rich-text-editor .w-md-editor-toolbar li button:hover {
          background-color: #dee2e6 !important;
        }
        .rich-text-editor .w-md-editor.w-md-editor-focus {
          border-color: #0d6efd !important;
          box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.1) !important;
        }
        .dark .rich-text-editor .w-md-editor {
          background-color: #2d3436 !important;
          border-color: #636e72 !important;
        }
        .dark .rich-text-editor .w-md-editor-text {
          color: #ddd !important;
          background-color: #2d3436 !important;
        }
        .dark .rich-text-editor .w-md-editor-toolbar {
          background-color: #636e72 !important;
          border-color: #2d3436 !important;
        }
        .dark .rich-text-editor .w-md-editor-toolbar li button {
          color: #ddd !important;
        }
      `}</style>
    </div>
  )
}
