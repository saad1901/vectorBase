'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import {
  AlertCircle, AlertTriangle, Bot, BrainCircuit, Check,
  Clock, Copy, History, KeyRound, Loader2, Plus,
  RotateCcw, Send, Sparkles, Trash2, User, Zap, RefreshCw,
  MessageSquare, Sliders, ShieldCheck, CheckCircle2, Info, X
} from 'lucide-react'
import {
  ApiError, api, GenerationParams, defaultGenerationParams
} from '@/lib/api'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

const LOCAL_STORAGE_KEY = 'rag_playground_api_key'

type LocalMessage = {
  role: 'user' | 'assistant'
  text: string
  usedRag?: boolean
  timestamp: string
}

function playgroundKeyName() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `playground-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
}

function formatTime(date: Date = new Date()) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(date)
}

function generateVisitorId() {
  return `visitor_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36).slice(-4)}`
}

function SwitchToggle({
  label,
  icon: Icon,
  checked,
  onChange,
  activeColor = 'primary',
}: {
  label: string
  icon?: React.ElementType
  checked: boolean
  onChange: (checked: boolean) => void
  activeColor?: 'primary' | 'sky'
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`group flex items-center gap-2.5 rounded-xl border px-3.5 py-1.5 cursor-pointer select-none transition-all shadow-xs ${
        checked
          ? activeColor === 'sky'
            ? 'border-sky-500/40 bg-sky-500/10 text-foreground'
            : 'border-primary/40 bg-primary/10 text-foreground'
          : 'border-border bg-background/80 text-muted-foreground hover:border-border/80 hover:bg-muted/30'
      }`}
    >
      {Icon && (
        <Icon
          className={`size-3.5 transition-colors ${
            checked
              ? activeColor === 'sky' ? 'text-sky-600' : 'text-primary'
              : 'text-muted-foreground'
          }`}
        />
      )}
      <span className="text-xs font-semibold">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        tabIndex={-1}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
          checked
            ? activeColor === 'sky' ? 'bg-sky-600' : 'bg-primary'
            : 'bg-muted-foreground/30'
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export default function PlaygroundPage() {
  // Chat state
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  
  // Session tracking
  const [visitorId, setVisitorId] = useState<string>('')
  const [activeConvId, setActiveConvId] = useState<string | null>(null)

  // API Key & Model Parameters
  const [activeKeyId, setActiveKeyId] = useState<number | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null)

  // Generation Parameters (Synced to Database when changed)
  const [genParams, setGenParams] = useState<GenerationParams>({ ...defaultGenerationParams })
  const [updatingParams, setUpdatingParams] = useState(false)
  const [dbSynced, setDbSynced] = useState(false)

  // RAG and History Toggles
  const [useRag, setUseRag] = useState(true)
  const [useHistory, setUseHistory] = useState(true)

  // Toast notification
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)

  // Initialize visitor ID and load stored API key on mount
  useEffect(() => {
    setVisitorId(generateVisitorId())
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        setApiKey(stored)
      }
    } catch {
      // Ignored for environments without localStorage
    }
  }, [])

  // Auto-scroll chat transcript to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function showToast(msg: string, type: 'success' | 'error' = 'success', duration = 3500) {
    setToast({ msg, type })
    setTimeout(() => setToast(null), duration)
  }

  // Clear API key field and localStorage without deleting the database key
  function clearApiKeyField() {
    setApiKey('')
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    } catch {
      // Ignored
    }
    showToast('API Key field cleared')
  }

  // Generate a new API key with current parameters for the playground
  async function createPlaygroundKey() {
    setCreating(true)
    setCreateError('')
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '*'
      const result = await api.tenantCreateApiKey(playgroundKeyName(), [origin], undefined, genParams)
      const secret = String(result.api_key ?? result.key ?? result.token ?? result.secret ?? '')
      if (!secret) throw new Error('API server did not return a key secret.')
      setApiKey(secret)

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, secret)
      } catch {
        // Ignored
      }

      if (result.id) {
        setActiveKeyId(result.id)
      } else {
        const keys = await api.tenantApiKeys()
        if (keys.length > 0) {
          const newest = keys.reduce((a, b) => (a.id > b.id ? a : b))
          setActiveKeyId(newest.id)
        }
      }
      setDbSynced(true)
      setTimeout(() => setDbSynced(false), 3000)
      showToast('Generated new client API Key & saved to local storage!')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not create API key.'
      setCreateError(msg)
      showToast(msg, 'error')
    } finally {
      setCreating(false)
    }
  }

  // Update generation parameters in the database live
  async function updateGenParam<K extends keyof GenerationParams>(key: K, value: GenerationParams[K]) {
    const nextParams = { ...genParams, [key]: value }
    setGenParams(nextParams)

    if (key === 'rag_strictness') {
      if (value === 'no_rag') setUseRag(false)
      else setUseRag(true)
    }

    if (activeKeyId) {
      setUpdatingParams(true)
      try {
        await api.tenantUpdateApiKey(activeKeyId, {
          generation_params: nextParams,
        })
        setDbSynced(true)
        setTimeout(() => setDbSynced(false), 2500)
        showToast(`Updated ${key.replace('_', ' ')} in database!`, 'success', 2500)
      } catch (err) {
        showToast('Could not update parameter in database.', 'error')
      } finally {
        setUpdatingParams(false)
      }
    }
  }

  async function copyKey() {
    if (!apiKey) return
    await navigator.clipboard.writeText(apiKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  async function copyMessageText(text: string, index: number) {
    await navigator.clipboard.writeText(text)
    setCopiedMsgIdx(index)
    setTimeout(() => setCopiedMsgIdx(null), 2000)
  }

  // Reset chat session and issue a new visitor / conversation ID
  function handleDeleteHistory() {
    const newVisitor = generateVisitorId()
    setVisitorId(newVisitor)
    setActiveConvId(null)
    setMessages([])
    setChatError('')
    showToast('Chat history cleared & new testing session issued!')
  }

  // Send query to RAG API endpoint
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!query.trim() || loading) return
    if (!apiKey.trim()) {
      setChatError('Please enter or generate a Client API Key first.')
      return
    }

    const currentQuery = query.trim()
    setQuery('')
    setChatError('')

    const userMsg: LocalMessage = {
      role: 'user',
      text: currentQuery,
      timestamp: formatTime(),
    }

    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await api.chatQuery(apiKey.trim(), {
        query: currentQuery,
        conversation_id: activeConvId ?? undefined,
        visitor_id: visitorId || undefined,
        use_rag: useRag,
        use_history: useHistory,
      })

      if (res.conversation_id) {
        setActiveConvId(res.conversation_id)
      }

      const assistantMsg: LocalMessage = {
        role: 'assistant',
        text: res.response,
        usedRag: res.used_rag,
        timestamp: formatTime(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (caught) {
      const msg =
        caught instanceof ApiError && caught.status === 401
          ? 'Invalid API key — verify your key and try again.'
          : caught instanceof ApiError && caught.status === 403
          ? 'CORS Domain Error — key not allowed for this origin.'
          : caught instanceof ApiError
          ? caught.message
          : 'Could not connect to the RAG chat server.'

      setChatError(msg)
      setMessages((prev) => prev.slice(0, -1))
      setQuery(currentQuery)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-medium shadow-2xl transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/90'
              : 'border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/90 dark:text-destructive-foreground'
          }`}
        >
          {toast.type === 'success' ? <Check className="size-4 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" /> Interactive Sandbox
            </span>
            {activeConvId && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                ID: {activeConvId.slice(0, 12)}…
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">RAG Chat Playground</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Simulate end-user queries against your embedded documents with configurable grounding and history parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteHistory}
            className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/15 transition-all shadow-xs"
            title="Clear current messages and issue a new test session ID"
          >
            <Trash2 className="size-3.5" />
            Delete History
          </button>
        </div>
      </div>

      {/* ── Main Chat Sandbox Container ── */}
      <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden flex flex-col min-h-[640px]">
        
        {/* ── Top Bar: Controls & API Key (3 Clean Rows) ── */}
        <div className="border-b border-border bg-muted/20 p-4 sm:p-5 space-y-4">
          
          {/* Row 1: Generate API Key */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground shrink-0">
              <KeyRound className="size-4 text-primary" />
              <span>Client API Key</span>
              <span className="text-[11px] font-normal text-muted-foreground">(this key will be stored locally)</span>
              {activeKeyId && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${
                  dbSynced ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-primary/10 text-primary'
                }`}>
                  {updatingParams ? <Loader2 className="size-2.5 animate-spin" /> : <ShieldCheck className="size-3" />}
                  {updatingParams ? 'Saving…' : dbSynced ? '✓ DB Synced' : `Key #${activeKeyId}`}
                </span>
              )}
            </div>
            
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  value={apiKey}
                  onChange={(e) => {
                    const val = e.target.value
                    setApiKey(val)
                    try {
                      if (val) {
                        localStorage.setItem(LOCAL_STORAGE_KEY, val)
                      } else {
                        localStorage.removeItem(LOCAL_STORAGE_KEY)
                      }
                    } catch {
                      // Ignored
                    }
                  }}
                  placeholder="Paste API key secret or generate one below…"
                  className="h-9 w-full rounded-xl border border-input bg-background pl-3 pr-8 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/60 transition-all"
                />
                {apiKey && (
                  <button
                    type="button"
                    onClick={clearApiKeyField}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Clear key field"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              {apiKey && (
                <button
                  type="button"
                  onClick={copyKey}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                >
                  {copiedKey ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              )}
              <button
                type="button"
                onClick={createPlaygroundKey}
                disabled={creating}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 shrink-0 shadow-xs"
              >
                {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                {creating ? 'Creating…' : 'Generate Key'}
              </button>
            </div>
          </div>

          {/* Row 2: Compact Parameters (Strictness, Length, Temp, Toggles & Session ID) in ONE Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
            <div className="flex flex-wrap items-center gap-3">
              {/* 1. RAG Strictness Select with Impact Descriptions */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Sliders className="size-3.5 text-primary shrink-0" />
                <span className="shrink-0 text-muted-foreground font-normal">Strictness:</span>
                <select
                  value={genParams.rag_strictness}
                  onChange={(e) => updateGenParam('rag_strictness', e.target.value as GenerationParams['rag_strictness'])}
                  className="h-8.5 rounded-xl border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/60 transition-all font-medium cursor-pointer"
                >
                  <option value="no_rag">No RAG — Direct Model</option>
                  <option value="strict">Strict — High Accuracy</option>
                  <option value="hybrid">Hybrid — Balanced Search</option>
                  <option value="flexible">Flexible — Broad Retrieval</option>
                </select>
              </div>

              {/* 2. Response Format Select */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <MessageSquare className="size-3.5 text-primary shrink-0" />
                <span className="shrink-0 text-muted-foreground font-normal">Length:</span>
                <select
                  value={genParams.response_length}
                  onChange={(e) => updateGenParam('response_length', e.target.value as GenerationParams['response_length'])}
                  className="h-8.5 rounded-xl border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/60 transition-all font-medium cursor-pointer"
                >
                  <option value="concise">Concise</option>
                  <option value="medium">Medium</option>
                  <option value="detailed">Detailed</option>
                  <option value="bullet_points">Bullets</option>
                </select>
              </div>

              {/* 3. Temperature Dropdown (0.0 to 2.0 with Impact Descriptions) */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Zap className="size-3.5 text-primary shrink-0" />
                <span className="shrink-0 text-muted-foreground font-normal">Temp:</span>
                <select
                  value={genParams.temperature.toFixed(1)}
                  onChange={(e) => updateGenParam('temperature', parseFloat(e.target.value))}
                  className="h-8.5 rounded-xl border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/60 transition-all font-medium cursor-pointer"
                >
                  <option value="0.0">0.0 — Factual &amp; Precise</option>
                  <option value="0.2">0.2 — Focused &amp; Exact</option>
                  <option value="0.5">0.5 — Balanced Output</option>
                  <option value="0.7">0.7 — Conversational</option>
                  <option value="1.0">1.0 — Creative &amp; Diverse</option>
                  <option value="1.5">1.5 — Highly Experimental</option>
                  <option value="2.0">2.0 — Maximum Randomness</option>
                </select>
              </div>

              {/* 4. Use RAG Toggle */}
              <SwitchToggle
                label="RAG"
                icon={BrainCircuit}
                checked={useRag}
                onChange={(val) => {
                  setUseRag(val)
                  if (!val && genParams.rag_strictness !== 'no_rag') {
                    updateGenParam('rag_strictness', 'no_rag')
                  } else if (val && genParams.rag_strictness === 'no_rag') {
                    updateGenParam('rag_strictness', 'strict')
                  }
                }}
                activeColor="primary"
              />

              {/* 5. Use History Toggle */}
              <SwitchToggle
                label="History"
                icon={History}
                checked={useHistory}
                onChange={setUseHistory}
                activeColor="sky"
              />
            </div>

            {/* 6. Session Info Badge */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-muted-foreground font-mono bg-background border border-border px-2.5 py-1 rounded-lg">
                Session: <strong className="text-foreground">{activeConvId ? activeConvId.slice(0, 10) : visitorId}</strong>
              </span>
              <button
                type="button"
                onClick={handleDeleteHistory}
                className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Reset Session ID"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Error Banners ── */}
        {createError && (
          <div role="alert" className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            {createError}
          </div>
        )}
        {chatError && (
          <div role="alert" className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            {chatError}
          </div>
        )}

        {/* ── Messages Transcript Area ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-[380px] max-h-[520px] bg-background/50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <span className="grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner">
                <Bot className="size-8" />
              </span>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-semibold text-foreground">Playground Ready</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Start asking questions to evaluate model responses. Adjust RAG strictness, length formatting, and temperature above.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="pt-4 grid gap-2 sm:grid-cols-2 w-full max-w-xl text-left">
                {[
                  { title: '📦 Order Status', query: 'Where is my order and what is the shipping timeline?' },
                  { title: '🔄 Returns & Refund', query: 'What is your refund policy for defective items?' },
                  { title: '✉️ Billing Account', query: 'How do I change my billing email and export receipts?' },
                  { title: '📄 Knowledge Base', query: 'Summarize our enterprise SLA commitments.' },
                ].map((sample) => (
                  <button
                    key={sample.title}
                    type="button"
                    onClick={() => setQuery(sample.query)}
                    className="flex flex-col justify-between p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-xs space-y-1 group"
                  >
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{sample.title}</span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">{sample.query}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 text-xs sm:text-sm ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary shadow-xs">
                  <Bot className="size-4" />
                </span>
              )}

              <div className="space-y-1 max-w-[85%] sm:max-w-[78%]">
                <div
                  className={`group relative rounded-2xl px-4 py-3 shadow-xs ${
                    msg.role === 'user'
                      ? 'rounded-br-xs bg-primary text-primary-foreground'
                      : 'rounded-bl-xs bg-muted text-foreground border border-border'
                  }`}
                >
                  <MarkdownRenderer
                    content={msg.text}
                    variant={msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}
                  />

                  {/* Copy message button */}
                  <button
                    type="button"
                    onClick={() => copyMessageText(msg.text, i)}
                    className={`absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                      msg.role === 'user'
                        ? 'text-primary-foreground/70 hover:bg-primary-foreground/10'
                        : 'text-muted-foreground hover:bg-background'
                    }`}
                    title="Copy message text"
                  >
                    {copiedMsgIdx === i ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  </button>
                </div>

                {/* Timestamp & Metadata Badges */}
                <div className={`flex items-center gap-2 px-1 text-[10px] text-muted-foreground ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span>{msg.timestamp}</span>
                  {msg.role === 'assistant' && msg.usedRag !== undefined && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                      msg.usedRag ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
                    }`}>
                      {msg.usedRag ? '✨ RAG Grounded' : 'Direct Model'}
                    </span>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                  <User className="size-4" />
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
              <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <Bot className="size-4 animate-pulse" />
              </span>
              <span className="flex items-center gap-1.5 rounded-2xl rounded-bl-xs bg-muted px-4 py-3 border border-border">
                <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input Bar ── */}
        <form onSubmit={send} className="border-t border-border p-3 sm:p-4 bg-card flex gap-2 sm:gap-3 items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your support query or question…"
            className="h-11 flex-1 rounded-xl border border-input bg-background px-4 text-xs sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/60 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !apiKey.trim() || !query.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20 shrink-0"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  )
}
