'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Check, Code2, Copy, Download, Edit3,
  Globe, Info, KeyRound, Loader2, MessageSquareText, Plus, RefreshCw,
  ShieldCheck, Trash2, X, ArrowRight, Sparkles, Sliders,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ApiError, api, clearTenantSession, getSessionToken, isExpiredSessionError,
  TenantApiKeySummary, GenerationParams, defaultGenerationParams,
} from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WIDGET_LINK = process.env.NEXT_PUBLIC_WIDGET_LINK || 'https://vector-base.b-cdn.net/widget.js'

const RAG_STRICTNESS_OPTIONS = [
  { value: 'no_rag', label: 'No RAG', info: 'Bypasses knowledge base grounding completely.' },
  { value: 'strict', label: 'Strict RAG', info: 'Strictly from knowledge base; refuses if missing.' },
  { value: 'hybrid', label: 'Hybrid', info: 'Knowledge base first; supplements if needed.' },
  { value: 'flexible', label: 'Flexible', info: 'Uses knowledge base as loose reference.' },
] as const

const RESPONSE_LENGTH_OPTIONS = [
  { value: 'concise', label: 'Concise' },
  { value: 'medium', label: 'Medium' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'bullet_points', label: 'Bullets' },
] as const

interface CreatedKeyInfo {
  name: string
  secret: string
  domains: string[]
  createdAt: string
}

function getSessionSecrets(): Record<number, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(sessionStorage.getItem('tenant_known_secrets') || '{}')
  } catch {
    return {}
  }
}

function saveSessionSecret(id: number, secret: string) {
  if (typeof window === 'undefined') return
  const current = getSessionSecrets()
  current[id] = secret
  sessionStorage.setItem('tenant_known_secrets', JSON.stringify(current))
}

function widgetEmbedCode(secret: string) {
  return `<!-- VectorBase AI Chatbot -->
<script
  src="${WIDGET_LINK}"
  data-api-key="${secret}"
  defer>
</script>`
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function downloadCredentialsCsv(keyInfo: CreatedKeyInfo) {
  const csvRows = [
    'Key Name,API Key Secret,Allowed Domains,Created At,Widget Embed Code',
    [
      keyInfo.name,
      keyInfo.secret,
      (keyInfo.domains.length ? keyInfo.domains : ['All origins']).join('; '),
      keyInfo.createdAt,
      widgetEmbedCode(keyInfo.secret),
    ].map(csvCell).join(','),
  ]
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'credentials-and-widget-code.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function InfoTooltip({
  title,
  info,
  suggestion,
  align = 'left',
}: {
  title: string
  info: string
  suggestion: string
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative inline-flex items-center ml-1.5" ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        onMouseEnter={() => setOpen(true)}
        className="inline-flex items-center justify-center size-4 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-[10px] font-bold shadow-xs cursor-pointer shrink-0"
        aria-label={`Info about ${title}`}
      >
        <Info className="size-2.5" />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-1.5 z-50 w-64 sm:w-72 rounded-xl border border-border bg-popover p-3 text-xs shadow-xl text-popover-foreground animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0 left-auto' : 'left-0 right-auto'
          }`}
        >
          <div className="flex items-center justify-between font-semibold text-foreground">
            <span className="flex items-center gap-1 text-xs">
              <Info className="size-3 text-primary" /> {title}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">{info}</p>
          <div className="mt-2 rounded-lg bg-primary/5 p-2 text-[10px] text-primary border border-primary/15 leading-tight">
            <strong>💡 Suggestion:</strong> {suggestion}
          </div>
        </div>
      )}
    </div>
  )
}

function RagBadge({ value }: { value: string }) {
  const map: Record<string, { label: string; className: string }> = {
    no_rag: { label: 'No RAG', className: 'bg-rose-500/10 text-rose-700' },
    strict: { label: 'Strict RAG', className: 'bg-violet-500/10 text-violet-700' },
    hybrid: { label: 'Hybrid RAG', className: 'bg-blue-500/10 text-blue-700' },
    flexible: { label: 'Flexible RAG', className: 'bg-sky-500/10 text-sky-700' },
  }
  const opt = map[value] ?? { label: value, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${opt.className}`}>
      {opt.label}
    </span>
  )
}

function LengthBadge({ value }: { value: string }) {
  const map: Record<string, { label: string; className: string }> = {
    concise: { label: 'Concise', className: 'bg-emerald-500/10 text-emerald-700' },
    medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-700' },
    detailed: { label: 'Detailed', className: 'bg-orange-500/10 text-orange-700' },
    bullet_points: { label: 'Bullets', className: 'bg-teal-500/10 text-teal-700' },
  }
  const opt = map[value] ?? { label: value, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${opt.className}`}>
      {opt.label}
    </span>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function ApiKeysPage() {
  // Form state
  const [label, setLabel] = useState('')
  const [domainInput, setDomainInput] = useState('')
  const [domains, setDomains] = useState<string[]>([])
  const [systemPrompt, setSystemPrompt] = useState('')
  const [genParams, setGenParams] = useState<GenerationParams>({ ...defaultGenerationParams })

  // Secret display modal & state
  const [createdModalKey, setCreatedModalKey] = useState<CreatedKeyInfo | null>(null)
  const [copied, setCopied] = useState('')
  const pendingSecret = useRef<string | null>(null)

  // Keys state
  const [creating, setCreating] = useState(false)
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [error, setError] = useState('')
  const [keys, setKeys] = useState<TenantApiKeySummary[]>([])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [knownSecrets, setKnownSecrets] = useState<Record<number, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Edit Key Modal state
  const [editingKey, setEditingKey] = useState<TenantApiKeySummary | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editDomainInput, setEditDomainInput] = useState('')
  const [editDomains, setEditDomains] = useState<string[]>([])
  const [editSystemPrompt, setEditSystemPrompt] = useState('')
  const [editGenParams, setEditGenParams] = useState<GenerationParams>({ ...defaultGenerationParams })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  // Revocation Confirmation Modal state
  const [revokingKey, setRevokingKey] = useState<TenantApiKeySummary | null>(null)
  const [revokingKeyLoading, setRevokingKeyLoading] = useState(false)

  useEffect(() => {
    setKnownSecrets(getSessionSecrets())
  }, [])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function openEditModal(key: TenantApiKeySummary) {
    setEditingKey(key)
    setEditLabel(key.key_name || '')
    setEditDomains(key.allowed_domains?.length ? key.allowed_domains : ['*'])
    setEditDomainInput('')
    setEditSystemPrompt(key.system_prompt || '')
    setEditGenParams(key.generation_params ? { ...key.generation_params } : { ...defaultGenerationParams })
    setEditError('')
  }

  function addEditDomain() {
    const val = editDomainInput.trim()
    if (!val || editDomains.includes(val)) return
    setEditDomains((prev) => [...prev, val])
    setEditDomainInput('')
  }

  async function saveKeyEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingKey) return
    setEditError('')

    let finalDomains = [...editDomains]
    const pendingDomain = editDomainInput.trim()
    if (pendingDomain && !finalDomains.includes(pendingDomain)) {
      finalDomains.push(pendingDomain)
      setEditDomains(finalDomains)
      setEditDomainInput('')
    }

    if (finalDomains.length === 0) {
      setEditError("Allowed Domains is required. Add at least one domain origin or '*' for open access.")
      return
    }

    const hasWildcard = finalDomains.some((d) => d.trim() === '*')
    const domainsToSend = hasWildcard ? [] : finalDomains

    setSavingEdit(true)
    try {
      const updatedName = editLabel.trim() || 'Production API Key'
      const updatedPrompt = editSystemPrompt.trim()

      await api.tenantUpdateApiKey(editingKey.id, {
        name: updatedName,
        allowed_domains: domainsToSend,
        system_prompt: updatedPrompt,
        generation_params: editGenParams,
      })

      setKeys((prev) =>
        prev.map((k) => (k.id === editingKey.id ? {
          ...k,
          key_name: updatedName,
          allowed_domains: finalDomains,
          system_prompt: updatedPrompt || null,
          generation_params: editGenParams,
        } : k)),
      )
      showToast('API Key configuration updated successfully!')
      setEditingKey(null)
    } catch (err) {
      if (isExpiredSessionError(err)) { redirectToLogin(true); return }
      setEditError(err instanceof ApiError ? err.message : 'Could not update API key.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function confirmRevokeKey() {
    if (!revokingKey) return
    setRevokingKeyLoading(true)
    try {
      await api.tenantRevokeApiKey(revokingKey.id)
      setKeys((prev) =>
        prev.map((k) => (k.id === revokingKey.id ? { ...k, is_active: false } : k)),
      )
      showToast('API Key revoked successfully.')
      setRevokingKey(null)
    } catch (err) {
      if (isExpiredSessionError(err)) { redirectToLogin(true); return }
      showToast(err instanceof ApiError ? err.message : 'Could not revoke API key.', 'error')
    } finally {
      setRevokingKeyLoading(false)
    }
  }

  function redirectToLogin(expired = false) {
    clearTenantSession()
    window.location.assign(expired ? '/login?expired=1' : '/login')
  }

  async function loadApiKeys() {
    if (!getSessionToken()) { redirectToLogin(); return }
    setLoadingKeys(true)
    setError('')
    try {
      const fetchedKeys = await api.tenantApiKeys()
      setKeys(fetchedKeys)
      if (pendingSecret.current && fetchedKeys.length > 0) {
        const newest = fetchedKeys.reduce((a, b) => (a.id > b.id ? a : b))
        saveSessionSecret(newest.id, pendingSecret.current)
        setKnownSecrets(getSessionSecrets())
        pendingSecret.current = null
      }
    } catch (reason) {
      if (isExpiredSessionError(reason)) { redirectToLogin(true); return }
      setError(reason instanceof ApiError ? reason.message : 'Unable to load API keys.')
    } finally {
      setLoadingKeys(false)
    }
  }

  useEffect(() => { loadApiKeys() }, [])

  function addDomain() {
    const val = domainInput.trim()
    if (!val || domains.includes(val)) return
    setDomains((prev) => [...prev, val])
    setDomainInput('')
  }

  function updateGenParam<K extends keyof GenerationParams>(key: K, value: GenerationParams[K]) {
    setGenParams((prev) => ({ ...prev, [key]: value }))
  }

  async function createApiKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!getSessionToken()) { redirectToLogin(); return }
    setError('')
    setCopied('')

    let finalDomains = [...domains]
    const pendingDomain = domainInput.trim()
    if (pendingDomain && !finalDomains.includes(pendingDomain)) {
      finalDomains.push(pendingDomain)
      setDomains(finalDomains)
      setDomainInput('')
    }

    if (finalDomains.length === 0) {
      setError("Allowed Domains is required. Please add at least one domain (e.g. 'https://my-site.com'), or enter '*' for open access to all domains.")
      return
    }

    const hasWildcard = finalDomains.some((d) => d.trim() === '*')
    const domainsToSend = hasWildcard ? undefined : finalDomains

    setCreating(true)
    try {
      const keyName = label.trim() || 'Production API Key'
      const result = await api.tenantCreateApiKey(
        keyName,
        domainsToSend,
        systemPrompt.trim() || undefined,
        genParams,
      )
      const nextSecret = String(result.api_key ?? result.key ?? result.token ?? result.secret ?? '')
      if (!nextSecret) throw new Error('The API did not return a key secret.')

      const createdInfo: CreatedKeyInfo = {
        name: keyName,
        secret: nextSecret,
        domains: [...finalDomains],
        createdAt: new Date().toISOString(),
      }

      setCreatedModalKey(createdInfo)
      pendingSecret.current = nextSecret

      setLabel('')
      setDomains([])
      setSystemPrompt('')
      setGenParams({ ...defaultGenerationParams })

      await loadApiKeys()
      showToast('API key created successfully!')
    } catch (reason) {
      if (isExpiredSessionError(reason)) { redirectToLogin(true); return }
      setError(reason instanceof Error ? reason.message : 'Unable to create API key.')
    } finally {
      setCreating(false)
    }
  }

  async function revokeKey(id: number) {
    setDeletingId(id)
    try {
      await api.tenantPost(`/api/v1/tenant/apikey/${id}/revoke`)
      setKeys((prev) => prev.filter((k) => k.id !== id))
      showToast('API key revoked successfully.')
    } catch {
      showToast('Could not revoke API key.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  async function copy(value: string, id: string) {
    await navigator.clipboard.writeText(value)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-xl transition-all ${
            toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {toast.type === 'success' ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* Creation Modal Display */}
      {createdModalKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 border-amber-500/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                  <KeyRound className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">API Key Created</h2>
                  <p className="text-xs text-muted-foreground">Copy your secret and ready-to-use widget code, or download both together.</p>
                </div>
              </div>
              <button
                onClick={() => setCreatedModalKey(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                This key will not be displayed again after closing this window.
              </div>

              <div>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Key Name</span>
                <p className="text-sm font-semibold text-foreground">{createdModalKey.name}</p>
              </div>

              <div>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">API Secret Token</span>
                <code className="mt-1 block break-all rounded-lg bg-background p-3 font-mono text-sm border border-border shadow-inner text-foreground select-all">
                  {createdModalKey.secret}
                </code>
              </div>

              {createdModalKey.domains.length > 0 && (
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Allowed Domains</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {createdModalKey.domains.map((d) => (
                      <span key={d} className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-700 font-medium">
                        <Globe className="size-2.5" />
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Code2 className="size-4 text-primary" /> Your Widget Code</h3>
                  <p className="mt-1 text-xs text-muted-foreground">This snippet already includes the API key you just created. Paste it before your website’s closing <code className="rounded bg-muted px-1">&lt;/body&gt;</code> tag.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copy(widgetEmbedCode(createdModalKey.secret), 'modal_widget_code')}
                  className="h-8 shrink-0 rounded-lg gap-1.5 text-xs"
                >
                  {copied === 'modal_widget_code' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  {copied === 'modal_widget_code' ? 'Copied Code!' : 'Copy Code'}
                </Button>
              </div>
              <pre className="mt-3 max-h-44 overflow-auto rounded-lg border border-border bg-background p-3 text-xs leading-5 text-foreground"><code>{widgetEmbedCode(createdModalKey.secret)}</code></pre>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                onClick={() => downloadCredentialsCsv(createdModalKey)}
                className="flex-1 h-10 rounded-xl gap-2 font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="size-4" /> Download secret &amp; widget code
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => copy(createdModalKey.secret, 'modal_secret')}
                className="h-10 rounded-xl gap-2 text-xs font-medium"
              >
                {copied === 'modal_secret' ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                {copied === 'modal_secret' ? 'Copied Secret!' : 'Copy Secret'}
              </Button>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Download or copy the secret and widget code before closing.</span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreatedModalKey(null)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Close Window
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Developer credentials</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">API Keys</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Create, domain-lock, and manage API keys. Configure custom system prompts and generation behavior per key.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/integration">
            <Button variant="outline" className="h-10 rounded-xl gap-2 text-xs font-medium">
              <Sparkles className="size-3.5 text-primary" /> Integration &amp; Widget <ArrowRight className="size-3.5" />
            </Button>
          </Link>
          <Button type="button" variant="outline" onClick={loadApiKeys} disabled={loadingKeys} className="h-10 shrink-0 rounded-xl">
            {loadingKeys ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sleek, Compact API Key Creation Form */}
      <section className="w-full rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
        <form onSubmit={createApiKey} className="space-y-5">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Plus className="size-4.5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">Create API Key</h2>
                <p className="text-[11px] text-muted-foreground">Configure key options, prompt persona, and model parameters.</p>
              </div>
            </div>
            <Button type="submit" disabled={creating} className="h-9 px-5 rounded-xl font-medium gap-1.5 text-xs shadow-sm">
              {creating ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
              {creating ? 'Creating…' : 'Generate Key'}
            </Button>
          </div>

          {/* Row 1: Key Name & Allowed Domains */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="flex items-center text-xs font-medium text-foreground mb-1">
                <span>Key Name</span>
                <span className="text-destructive ml-0.5">*</span>
                <InfoTooltip
                  title="Key Name"
                  info="Identifies this key in metrics and key list."
                  suggestion="e.g. 'Production Store Widget' or 'Support Bot Staging'."
                />
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Production Store Widget"
                required
                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring/60 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center text-xs font-medium text-foreground mb-1">
                <span>Allowed Domains</span>
                <span className="text-destructive ml-0.5">*</span>
                <InfoTooltip
                  title="Allowed Domains (Required)"
                  info="Restricts API requests to specific website origins (CORS security filter). At least 1 domain is required."
                  suggestion="Enter origins like 'https://my-site.com'. If you want open access, enter '*' to permit all origins."
                  align="right"
                />
              </label>
              <div className="flex gap-1.5">
                <input
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addDomain()
                    }
                  }}
                  placeholder="https://example.com or * (for open access)"
                  className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring/60 transition-all"
                />
                <button
                  type="button"
                  onClick={addDomain}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-border bg-background px-3 text-xs font-medium hover:bg-muted transition-colors shrink-0"
                >
                  <Plus className="size-3.5 text-primary" />
                  Add
                </button>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Required. Add domain origins or enter <code className="rounded bg-primary/10 px-1 font-mono text-[10px] text-primary font-semibold">*</code> for open access.
              </p>
              {domains.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {domains.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium">
                      <Globe className="size-2.5 text-primary" />
                      {d}
                      <button
                        type="button"
                        onClick={() => setDomains((p) => p.filter((x) => x !== d))}
                        className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="size-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Prompt (left) + Choice Selectors in front (right) */}
          <div className="grid gap-4 md:grid-cols-2 items-start">
            {/* Left: System Prompt (5 rows space) */}
            <div>
              <label className="flex items-center text-xs font-medium text-foreground mb-1">
                <MessageSquareText className="size-3.5 text-primary mr-1" />
                <span>Custom System Prompt Persona</span>
                <InfoTooltip
                  title="Custom System Prompt"
                  info="Overrides workspace persona specifically for requests using this API key."
                  suggestion="e.g. 'You are a polite support agent for Acme. Be concise and helpful.'"
                />
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                placeholder="Optional persona override (e.g. You are a friendly support assistant for Acme Corp. Be helpful, polite, accurate, and concise...)"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring/60 transition-all resize-none"
              />
            </div>

            {/* Right: Both Choice Selectors in front of prompt */}
            <div className="space-y-3">
              {/* RAG Grounding Strictness Selector */}
              <div>
                <label className="flex items-center text-xs font-medium text-foreground mb-1">
                  <Sliders className="size-3 text-primary mr-1" />
                  <span>RAG Grounding Strictness</span>
                  <InfoTooltip
                    title="RAG Strictness"
                    info="Controls how strictly the AI model relies on knowledge base docs."
                    suggestion="Use 'No RAG' for open chat; use 'Strict RAG' for compliance."
                    align="right"
                  />
                </label>
                <div className="inline-flex rounded-xl border border-input bg-muted/40 p-1 w-full">
                  {RAG_STRICTNESS_OPTIONS.map((opt) => {
                    const isSelected = genParams.rag_strictness === opt.value
                    const colorMap: Record<string, string> = {
                      no_rag: 'bg-rose-600 text-white shadow-md font-semibold',
                      strict: 'bg-violet-600 text-white shadow-md font-semibold',
                      hybrid: 'bg-blue-600 text-white shadow-md font-semibold',
                      flexible: 'bg-sky-600 text-white shadow-md font-semibold',
                    }
                    const activeClass = colorMap[opt.value] ?? 'bg-primary text-primary-foreground shadow-md font-semibold'
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateGenParam('rag_strictness', opt.value as GenerationParams['rag_strictness'])}
                        className={`flex-1 rounded-lg py-1.5 px-1 text-[11px] font-medium transition-all ${
                          isSelected ? activeClass : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Response Format & Length Selector */}
              <div>
                <label className="flex items-center text-xs font-medium text-foreground mb-1">
                  <span>Response Format &amp; Length</span>
                  <InfoTooltip
                    title="Response Format"
                    info="Sets output length and formatting structure generated by the bot."
                    suggestion="Use 'Concise' for chat widgets, 'Bullets' for guides."
                    align="right"
                  />
                </label>
                <div className="inline-flex rounded-xl border border-input bg-muted/40 p-1 w-full">
                  {RESPONSE_LENGTH_OPTIONS.map((opt) => {
                    const isSelected = genParams.response_length === opt.value
                    const colorMap: Record<string, string> = {
                      concise: 'bg-emerald-600 text-white shadow-md font-semibold',
                      medium: 'bg-amber-600 text-white shadow-md font-semibold',
                      detailed: 'bg-orange-600 text-white shadow-md font-semibold',
                      bullet_points: 'bg-teal-600 text-white shadow-md font-semibold',
                    }
                    const activeClass = colorMap[opt.value] ?? 'bg-primary text-primary-foreground shadow-md font-semibold'
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateGenParam('response_length', opt.value as GenerationParams['response_length'])}
                        className={`flex-1 rounded-lg py-1.5 px-1 text-[11px] font-medium transition-all ${
                          isSelected ? activeClass : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Temperature & Max Tokens */}
          <div className="pt-3 border-t border-border/70 grid gap-4 md:grid-cols-2 items-end">
            {/* Temperature Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center text-xs font-medium text-foreground">
                  <span>Temperature (Creativity)</span>
                  <InfoTooltip
                    title="Creativity / Temperature"
                    info="Adjusts response randomness. 0.0 is deterministic; 1.0 is creative."
                    suggestion="0.0–0.2 for strict QA; 0.7–1.0 for creative assistants."
                  />
                </label>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-primary">
                  {genParams.temperature.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={genParams.temperature}
                onChange={(e) => updateGenParam('temperature', parseFloat(e.target.value))}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-0.5">
                <span>0.0 Factual</span>
                <span>1.0 Creative</span>
              </div>
            </div>

            {/* Max Output Tokens */}
            <div>
              <label className="flex items-center text-xs font-medium text-foreground mb-1.5" htmlFor="max_output_tokens">
                <span>Max Output Tokens</span>
                <InfoTooltip
                  title="Max Output Tokens"
                  info="Max tokens generated per single turn (~1 token ≈ 0.75 words)."
                  suggestion="800 tokens is standard. Set to 2000+ for long reports."
                  align="right"
                />
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="max_output_tokens"
                  type="number"
                  min={100}
                  max={10000}
                  step={50}
                  value={genParams.max_output_tokens || ''}
                  onChange={(e) => {
                    const raw = e.target.value
                    updateGenParam('max_output_tokens', raw === '' ? ('' as unknown as number) : Number(raw))
                  }}
                  onBlur={() => {
                    const val = Number(genParams.max_output_tokens)
                    if (!val || val < 100) updateGenParam('max_output_tokens', 100)
                    else if (val > 10000) updateGenParam('max_output_tokens', 10000)
                  }}
                  placeholder="800"
                  className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring/60 transition-all font-mono"
                />
                <span className="shrink-0 text-[11px] text-muted-foreground font-mono">tokens</span>
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* Active Keys Table */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-semibold text-lg">Active API Keys</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              All credentials associated with this workspace. Revoke any key instantly if compromised.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {keys.length} total keys
            </span>
            <ShieldCheck className="size-5 text-primary" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Key Name</th>
                <th className="px-5 py-3">Allowed Domains</th>
                <th className="px-5 py-3">AI Settings</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Last Used</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingKeys && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin text-primary" />
                    Loading API keys…
                  </td>
                </tr>
              )}
              {!loadingKeys && keys.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No API keys created yet. Generate one above.
                  </td>
                </tr>
              )}
              {!loadingKeys &&
                keys.map((key) => (
                  <tr key={key.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="max-w-[180px]">
                        <span className="block truncate font-medium text-foreground">{key.key_name?.trim() || 'Unnamed Key'}</span>
                        {key.system_prompt && (
                          <span
                            className="mt-0.5 flex items-center gap-1 max-w-[160px] truncate text-xs text-muted-foreground"
                            title={key.system_prompt}
                          >
                            <MessageSquareText className="size-3 shrink-0" />
                            {key.system_prompt}
                          </span>
                        )}
                        {knownSecrets[key.id] && (
                          <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                            <Check className="size-3" /> Secret in session
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {key.allowed_domains?.length ? (
                          key.allowed_domains.map((d) => (
                            <span key={d} className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700">
                              <Globe className="size-2.5" />
                              {d}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">All origins allowed</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {key.generation_params ? (
                        <div className="flex flex-wrap gap-1">
                          <RagBadge value={key.generation_params.rag_strictness} />
                          <LengthBadge value={key.generation_params.response_length} />
                          <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            temp {key.generation_params.temperature.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Default</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          key.is_active ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {key.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{formatDate(key.created_at)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{formatDate(key.last_used_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(key)}
                          disabled={!key.is_active}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:opacity-40 transition-colors"
                          title="Edit domains and parameters"
                        >
                          <Edit3 className="size-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => setRevokingKey(key)}
                          disabled={!key.is_active}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 transition-colors"
                          title="Revoke API key"
                        >
                          <Trash2 className="size-3" />
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit API Key & Allowed Domains Modal */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Edit3 className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Edit API Key Configuration</h2>
                  <p className="text-xs text-muted-foreground">Update key label, domain origins, and model parameters</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingKey(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {editError && (
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                {editError}
              </div>
            )}

            <form onSubmit={saveKeyEdit} className="space-y-5">
              {/* Key Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Key Name / Identifier</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="e.g. Production Web Widget"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/60"
                  required
                />
              </div>

              {/* Allowed Domains */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-foreground">Allowed Domains (CORS)</label>
                  <span className="text-[11px] text-muted-foreground">Type '*' for open access</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editDomainInput}
                    onChange={(e) => setEditDomainInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEditDomain() } }}
                    placeholder="app.example.com or *"
                    className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring/60"
                  />
                  <button
                    type="button"
                    onClick={addEditDomain}
                    className="h-9 px-3.5 rounded-xl border border-border bg-muted/50 text-xs font-medium hover:bg-muted text-foreground transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {editDomains.map((d, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {d}
                      <button
                        type="button"
                        onClick={() => setEditDomains((prev) => prev.filter((_, idx) => idx !== i))}
                        className="hover:text-destructive transition-colors ml-1"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {editDomains.length === 0 && (
                    <span className="text-xs text-amber-600 font-medium">⚠️ No allowed domains specified. Add at least one or '*'</span>
                  )}
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Custom System Prompt (Optional)</label>
                <textarea
                  value={editSystemPrompt}
                  onChange={(e) => setEditSystemPrompt(e.target.value)}
                  placeholder="e.g. You are a helpful support agent for Acme Inc…"
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-ring/60"
                />
              </div>

              {/* Generation Parameters */}
              <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sliders className="size-3.5 text-primary" /> Model Generation Parameters
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* RAG Strictness */}
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">RAG Strictness</label>
                    <select
                      value={editGenParams.rag_strictness}
                      onChange={(e) => setEditGenParams((p) => ({ ...p, rag_strictness: e.target.value as GenerationParams['rag_strictness'] }))}
                      className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs outline-none"
                    >
                      {RAG_STRICTNESS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Response Length */}
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Response Length</label>
                    <select
                      value={editGenParams.response_length}
                      onChange={(e) => setEditGenParams((p) => ({ ...p, response_length: e.target.value as GenerationParams['response_length'] }))}
                      className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs outline-none"
                    >
                      {RESPONSE_LENGTH_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Temperature */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                      <span>Temperature</span>
                      <span className="font-mono text-foreground">{editGenParams.temperature.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={editGenParams.temperature}
                      onChange={(e) => setEditGenParams((p) => ({ ...p, temperature: parseFloat(e.target.value) }))}
                      className="w-full accent-primary"
                    />
                  </div>

                  {/* Max Output Tokens */}
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Max Output Tokens</label>
                    <input
                      type="number"
                      min="64"
                      max="8192"
                      value={editGenParams.max_output_tokens}
                      onChange={(e) => setEditGenParams((p) => ({ ...p, max_output_tokens: parseInt(e.target.value) || 2048 }))}
                      className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingKey(null)}
                  disabled={savingEdit}
                  className="h-9 px-4 rounded-xl border border-border bg-background text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex h-9 items-center gap-1.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {savingEdit ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  {savingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revocation Confirmation Modal */}
      {revokingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Revoke API Key</h2>
                <p className="text-xs text-muted-foreground">Immediate access termination</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to revoke <strong className="text-foreground">{revokingKey.key_name || revokingKey.prefix}</strong>? Applications relying on this key will immediately receive authentication errors.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setRevokingKey(null)}
                disabled={revokingKeyLoading}
                className="h-9 px-4 rounded-xl border border-border bg-background text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRevokeKey}
                disabled={revokingKeyLoading}
                className="inline-flex h-9 items-center gap-1.5 px-4 rounded-xl bg-destructive text-white text-xs font-medium hover:bg-destructive/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {revokingKeyLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                {revokingKeyLoading ? 'Revoking…' : 'Confirm Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integration Code Sample */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Code2 className="mt-0.5 size-5 text-primary" />
          <div>
            <h2 className="font-semibold">Backend Integration Sample</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Send chat traffic to your RAG endpoint programmatically using your API key.
            </p>
          </div>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background p-4 text-xs leading-6 font-mono">
          <code>{`await fetch('${API_URL}/api/v1/chat/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_PUBLIC_API_KEY'
  },
  body: JSON.stringify({
    query: 'How do I request a refund?',
    use_rag: true,
    use_history: true
  })
})`}</code>
        </pre>
      </section>
    </div>
  )
}
