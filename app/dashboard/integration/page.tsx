'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, ArrowRight, Bot, Check, Code2, Copy, Eye,
  Globe, KeyRound, Loader2, MessageSquareText, ShieldCheck, Sparkles,
  X, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApiError, api, TenantApiKeySummary } from '@/lib/api'

const API_URL = ''
const CDN_SCRIPT = process.env.NEXT_PUBLIC_WIDGET_LINK || 'https://vector-base.b-cdn.net/widget.js'

function getSessionSecrets(): Record<number, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(sessionStorage.getItem('tenant_known_secrets') || '{}')
  } catch {
    return {}
  }
}

function embedSnippet(apiKey: string) {
  return `<!-- VectorBase AI Chatbot Embed -->
<script
  src="${CDN_SCRIPT}"
  data-api-key="${apiKey}"
  data-api-url="${API_URL}/api/v1"
  defer>
</script>`
}

export default function IntegrationPage() {
  const [keys, setKeys] = useState<TenantApiKeySummary[]>([])
  const [keysLoading, setKeysLoading] = useState(true)
  const [keysError, setKeysError] = useState('')

  const [knownSecrets, setKnownSecrets] = useState<Record<number, string>>({})
  const [selectedSnippetId, setSelectedSnippetId] = useState<string>('')
  const [snippetCopied, setSnippetCopied] = useState(false)

  const [aiPromptCopied, setAiPromptCopied] = useState(false)

  const [previewKeyId, setPreviewKeyId] = useState<string>('')
  const [manualPreviewKey, setManualPreviewKey] = useState('')
  const [previewActive, setPreviewActive] = useState(false)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    setKnownSecrets(getSessionSecrets())
  }, [])

  async function loadKeys() {
    setKeysLoading(true)
    setKeysError('')
    try {
      const activeKeys = await api.tenantApiKeys()
      setKeys(activeKeys)
      if (activeKeys.length > 0 && !selectedSnippetId) {
        setSelectedSnippetId(String(activeKeys[0].id))
        setPreviewKeyId(String(activeKeys[0].id))
      }
    } catch (err) {
      setKeysError(err instanceof ApiError ? err.message : 'Could not load API keys.')
    } finally {
      setKeysLoading(false)
    }
  }

  useEffect(() => {
    loadKeys()
  }, [])

  useEffect(() => () => {
    scriptRef.current?.remove()
  }, [])

  const snippetKeyValue = selectedSnippetId
    ? knownSecrets[Number(selectedSnippetId)] ?? 'YOUR_PUBLIC_API_KEY'
    : 'YOUR_PUBLIC_API_KEY'

  const snippet = embedSnippet(snippetKeyValue)

  const aiPromptText = `Please integrate the VectorBase AI Chatbot widget into this web application codebase.

Here is the official embed script snippet:

<!-- VectorBase AI Chatbot Embed -->
<script
  src="${CDN_SCRIPT}"
  data-api-key="${snippetKeyValue}"
  data-api-url="${API_URL}/api/v1"
  defer>
</script>

Instructions for integration:
1. Locate the main root layout or HTML entry point in this project (e.g. index.html, app/layout.tsx, or App.jsx).
2. Insert this script tag right before the closing </body> tag, or use the framework's native script component (such as Next.js <Script strategy="afterInteractive" />).
3. Ensure the script loads with defer/async so it doesn't block initial page rendering.
4. Verify that the floating chatbot trigger button appears in the bottom-right corner of the page.
5. If using Next.js/React, place it inside the layout component or root body tag.`

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet)
    setSnippetCopied(true)
    setTimeout(() => setSnippetCopied(false), 2000)
  }

  async function copyAiPrompt() {
    await navigator.clipboard.writeText(aiPromptText)
    setAiPromptCopied(true)
    setTimeout(() => setAiPromptCopied(false), 2000)
  }

  const selectedKeyHasSecret = previewKeyId ? Boolean(knownSecrets[Number(previewKeyId)]) : false
  const resolvedPreviewSecret = previewKeyId
    ? knownSecrets[Number(previewKeyId)] ?? manualPreviewKey.trim()
    : manualPreviewKey.trim()

  function injectWidget(keySecret: string) {
    if (scriptRef.current) {
      scriptRef.current.remove()
      scriptRef.current = null
    }
    if (!keySecret) return
    const script = document.createElement('script')
    script.src = CDN_SCRIPT
    script.setAttribute('data-api-key', keySecret)
    script.setAttribute('data-api-url', `${API_URL}/api/v1`)
    script.defer = true
    document.body.appendChild(script)
    scriptRef.current = script
    setPreviewActive(true)
  }

  function stopPreview() {
    if (scriptRef.current) {
      scriptRef.current.remove()
      scriptRef.current = null
    }
    setPreviewActive(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Embed &amp; Deploy</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Widget Integration</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Embed your RAG chatbot into any webpage using our script snippet, and preview the live widget in real time.
          </p>
        </div>
        <Link href="/dashboard/api-keys">
          <Button variant="outline" className="h-10 rounded-xl gap-2 text-xs font-medium shrink-0">
            <KeyRound className="size-4 text-primary" /> Manage API Keys <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">API Key &amp; Domain Management</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              To generate new keys, lock allowed domains, configure custom system prompts, or revoke credentials, visit the API Keys page.
            </p>
          </div>
        </div>
        <Link href="/dashboard/api-keys" className="shrink-0">
          <Button className="h-9 rounded-lg text-xs gap-1.5">
            <KeyRound className="size-3.5" /> Go to API Keys
          </Button>
        </Link>
      </div>

      {/* Section: Add Widget with AI */}
      <section className="rounded-xl border border-primary/30 bg-gradient-to-b from-card to-primary/5 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Sparkles className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg text-foreground">Add Widget with AI</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                  AI Coding Assistants
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Copy this pre-formatted prompt directly into your AI IDE or Assistant to automatically integrate the chatbot widget into your project.
              </p>
            </div>
          </div>

          <Button
            onClick={copyAiPrompt}
            className="h-9 rounded-xl gap-2 text-xs font-semibold shadow-sm shrink-0 bg-primary hover:bg-primary/90"
          >
            {aiPromptCopied ? <Check className="size-4 text-white" /> : <Copy className="size-4" />}
            {aiPromptCopied ? 'Prompt Copied!' : 'Copy AI Prompt'}
          </Button>
        </div>

        {/* Supported AI IDE & Assistants Logos / Badges */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Bot className="size-3.5 text-primary" />
            Works seamlessly with leading AI platforms:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {/* Cursor */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xs hover:border-primary/50 transition-colors">
              <img src="/logos/cursorr.png" alt="Cursor" className="size-4 object-contain" />
              <span>Cursor</span>
            </div>

            {/* VS Code */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xs hover:border-primary/50 transition-colors">
              <img src="/logos/vscode.png" alt="VS Code" className="size-4 object-contain" />
              <span>VS Code</span>
            </div>

            {/* GitHub Copilot */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xs hover:border-primary/50 transition-colors">
              <img src="/logos/copilot.png" alt="Copilot" className="size-4 object-contain" />
              <span>Copilot</span>
            </div>

            {/* Kiro */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xs hover:border-primary/50 transition-colors">
              <img src="/logos/kiro.png" alt="Kiro" className="size-4 object-contain" />
              <span>Kiro</span>
            </div>

            {/* Antigravity */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xs hover:border-primary/50 transition-colors">
              <img src="/logos/antigravity.png" alt="Antigravity" className="size-4 object-contain" />
              <span>Antigravity</span>
            </div>

            {/* Lovable */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xs hover:border-primary/50 transition-colors">
              <img src="/logos/lovable.png" alt="Lovable" className="size-4 object-contain" />
              <span>Lovable</span>
            </div>
          </div>
        </div>

        {/* Formatted AI Prompt Container */}
        <div className="rounded-xl border border-border bg-background p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>AI Prompt (Ready to paste into chat):</span>
            <span className="text-[10px] text-primary">Target: {selectedSnippetId ? `Key #${selectedSnippetId}` : 'Default Key'}</span>
          </div>
          <pre className="overflow-x-auto text-[11px] leading-5 text-foreground font-mono bg-muted/40 p-3 rounded-lg border border-border/50 max-h-48 whitespace-pre-wrap">
            {aiPromptText}
          </pre>
        </div>
      </section>

      {/* Section 1: Code Embed Generator */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Code2 className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-lg">Embed Code Snippet</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Paste this script tag right before the closing <code className="rounded bg-muted px-1 py-0.5">&lt;/body&gt;</code> tag of your website.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="snippet-key-select" className="text-xs text-muted-foreground hidden sm:inline">
                API Key:
              </label>
              <select
                id="snippet-key-select"
                value={selectedSnippetId}
                onChange={(e) => setSelectedSnippetId(e.target.value)}
                className="h-9 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring/60"
              >
                <option value="">Placeholder (YOUR_PUBLIC_API_KEY)</option>
                {keys.map((k) => (
                  <option key={k.id} value={String(k.id)}>
                    {k.key_name || `Key #${k.id}`} {knownSecrets[k.id] ? '✓' : ''}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={copySnippet}
              variant="outline"
              className="h-9 rounded-xl gap-1.5 text-xs font-medium"
            >
              {snippetCopied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              {snippetCopied ? 'Copied Snippet!' : 'Copy Code'}
            </Button>
          </div>
        </div>

        {/* Code Snippet Box */}
        <pre className="overflow-x-auto p-5 text-xs leading-6 text-foreground font-mono bg-background/50">
          <code>{snippet}</code>
        </pre>

        {selectedSnippetId && !knownSecrets[Number(selectedSnippetId)] && (
          <div className="mx-5 mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="size-4 shrink-0" />
            Secret token is not in active session. Generate a new key on the API Keys page to preview with live secret, or paste secret below.
          </div>
        )}

        {/* Instructions */}
        <div className="border-t border-border p-5">
          <h3 className="text-sm font-semibold">Implementation Instructions</h3>
          <ol className="mt-3 list-decimal list-inside space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>Copy the script tag snippet above.</li>
            <li>Paste it into your website HTML right before the closing <code className="rounded bg-muted px-1">&lt;/body&gt;</code> tag.</li>
            <li>
              Ensure your site domain origin (e.g. <code className="rounded bg-muted px-1">{origin || 'https://your-domain.com'}</code>) is whitelisted in the key's <strong className="text-foreground">Allowed Domains</strong> on the <Link href="/dashboard/api-keys" className="text-primary underline">API Keys page</Link>.
            </li>
            <li>The chat widget bubble will automatically mount in the bottom-right corner of your site.</li>
          </ol>
        </div>
      </section>

      {/* Section 2: Live Widget Preview */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Zap className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-lg">Live Widget Preview &amp; Test Zone</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Inject the real chatbot script onto this page to test its behavior and responses before embedding on production.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium mb-1.5">Select Key for Preview</label>
              <select
                value={previewKeyId}
                onChange={(e) => {
                  setPreviewKeyId(e.target.value)
                  stopPreview()
                }}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/60"
              >
                <option value="">Choose an API key…</option>
                {keys.map((k) => (
                  <option key={k.id} value={String(k.id)}>
                    {k.key_name || `Key #${k.id}`} {knownSecrets[k.id] ? '✓ (Secret Ready)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {previewKeyId && !selectedKeyHasSecret && (
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs font-medium mb-1.5">
                  Paste Secret Token <span className="text-muted-foreground">(from creation)</span>
                </label>
                <input
                  value={manualPreviewKey}
                  onChange={(e) => setManualPreviewKey(e.target.value)}
                  placeholder="pk_live_xxxx…"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-ring/60"
                />
              </div>
            )}

            <div className="flex gap-2 shrink-0">
              {!previewActive ? (
                <Button
                  onClick={() => injectWidget(resolvedPreviewSecret)}
                  disabled={!resolvedPreviewSecret}
                  className="h-10 rounded-xl gap-2 text-xs font-medium"
                >
                  <Eye className="size-4" /> Launch Live Preview
                </Button>
              ) : (
                <Button
                  onClick={stopPreview}
                  variant="outline"
                  className="h-10 rounded-xl gap-2 text-xs font-medium border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <X className="size-4" /> Stop Preview
                </Button>
              )}
            </div>
          </div>

          {previewActive && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
              <Check className="size-4 shrink-0 text-emerald-600" />
              <span>Widget active! Look for the chat trigger button in the bottom right corner of your screen.</span>
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
            <p>
              <strong className="text-foreground">Troubleshooting Tips:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>
                <strong className="text-foreground">403 Forbidden:</strong> Origin domain is not authorized. Add{' '}
                <code className="rounded bg-muted px-1 text-foreground">{origin || 'your localhost URL'}</code> to the key's Allowed Domains on the API Keys page.
              </li>
              <li>
                <strong className="text-foreground">402 Payment Required:</strong> Your workspace token balance is exhausted. Top up tokens in your Profile &amp; Billing settings.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
