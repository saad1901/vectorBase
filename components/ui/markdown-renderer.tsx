'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface Props {
  content: string
  /** 'bubble' = inside a chat bubble (dark or muted bg), 'prose' = light card */
  variant?: 'bubble-user' | 'bubble-assistant' | 'prose'
}

export function MarkdownRenderer({ content, variant = 'bubble-assistant' }: Props) {
  const isUser = variant === 'bubble-user'

  const components: Components = {
    // Paragraphs — no extra margin on the last one inside a bubble
    p: ({ children }) => (
      <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
    ),

    // Headings
    h1: ({ children }) => <h1 className="mb-2 mt-3 text-base font-bold first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-1.5 mt-3 text-sm font-bold first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</h3>,

    // Lists
    ul: ({ children }) => (
      <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,

    // Inline code
    code: ({ children, className }) => {
      // If className has "language-" it's a fenced block — handled by pre
      const isBlock = className?.startsWith('language-')
      if (isBlock) return <code className={className}>{children}</code>
      return (
        <code
          className={`rounded px-1 py-0.5 font-mono text-[0.8em] ${
            isUser
              ? 'bg-white/20 text-white'
              : 'bg-border/60 text-foreground'
          }`}
        >
          {children}
        </code>
      )
    },

    // Fenced code blocks
    pre: ({ children }) => (
      <pre
        className={`mb-2 mt-1 overflow-x-auto rounded-lg p-3 font-mono text-xs leading-5 last:mb-0 ${
          isUser
            ? 'bg-black/25 text-white'
            : 'bg-muted text-foreground border border-border'
        }`}
      >
        {children}
      </pre>
    ),

    // Blockquote
    blockquote: ({ children }) => (
      <blockquote
        className={`mb-2 border-l-2 pl-3 italic last:mb-0 ${
          isUser ? 'border-white/40 text-white/80' : 'border-primary/40 text-muted-foreground'
        }`}
      >
        {children}
      </blockquote>
    ),

    // Horizontal rule
    hr: () => (
      <hr className={`my-2 ${isUser ? 'border-white/20' : 'border-border'}`} />
    ),

    // Strong / em
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline underline-offset-2 ${
          isUser ? 'text-white hover:text-white/80' : 'text-primary hover:text-primary/80'
        }`}
      >
        {children}
      </a>
    ),

    // Tables (GFM)
    table: ({ children }) => (
      <div className="mb-2 overflow-x-auto last:mb-0">
        <table className="w-full border-collapse text-xs">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className={isUser ? 'bg-white/15' : 'bg-muted/70'}>{children}</thead>
    ),
    th: ({ children }) => (
      <th className="border border-current/20 px-2 py-1 text-left font-semibold">{children}</th>
    ),
    td: ({ children }) => (
      <td className="border border-current/10 px-2 py-1">{children}</td>
    ),
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}
