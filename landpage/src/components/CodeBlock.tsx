'use client'

import { useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language = 'bash' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/8 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <span className="text-xs text-muted">{language}</span>
        <button
          onClick={copy}
          className="text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary"
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm font-mono text-gray-300 scrollbar-none">
        <code>{code}</code>
      </pre>
    </div>
  )
}
