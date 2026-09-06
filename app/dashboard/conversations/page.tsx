'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bot, Calendar, ChevronLeft, Clock, Filter, Loader2,
  MessageSquare, RefreshCw, Search, SortAsc, SortDesc,
  Trash2, User, XCircle,
} from 'lucide-react'
import { ApiError, api, ConversationSummary, ConversationDetail } from '@/lib/api'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

// ─── helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

function startOfDay(iso: string) {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

type SortKey   = 'newest' | 'oldest' | 'az' | 'za' | 'most_msgs'
type DateRange = 'all' | 'today' | '7d' | '30d'

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  const [selected, setSelected]               = useState<ConversationDetail | null>(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [transcriptError, setTranscriptError] = useState('')
  const [deletingId, setDeletingId]           = useState<string | null>(null)

  // ── filters ────────────────────────────────────────────────────────────────
  const [search, setSearch]         = useState('')
  const [sortKey, setSortKey]       = useState<SortKey>('newest')
  const [dateRange, setDateRange]   = useState<DateRange>('all')
  const [minMessages, setMinMessages] = useState<number>(0)

  // ── load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      setConversations(await api.listConversations({ limit: 100 }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load conversations.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── filtered + sorted list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = Date.now()
    const rangeCutoff: Record<DateRange, number> = {
      all:  0,
      today: startOfDay(new Date().toISOString()),
      '7d':  now - 7  * 86400000,
      '30d': now - 30 * 86400000,
    }
    const cutoff = rangeCutoff[dateRange]

    let list = conversations.filter((c) => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
      if (cutoff && new Date(c.updated_at).getTime() < cutoff) return false
      return true
    })

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'newest': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'oldest': return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        case 'az':     return a.title.localeCompare(b.title)
        case 'za':     return b.title.localeCompare(a.title)
        default:       return 0
      }
    })

    return list
  }, [conversations, search, sortKey, dateRange])

  // ── open transcript ────────────────────────────────────────────────────────
  async function open(id: string) {
    setTranscriptError(''); setTranscriptLoading(true)
    try { setSelected(await api.getConversation(id)) }
    catch (err) { setTranscriptError(err instanceof ApiError ? err.message : 'Could not load transcript.') }
    finally { setTranscriptLoading(false) }
  }

  // ── delete ─────────────────────────────────────────────────────────────────
  async function del(id: string) {
    setDeletingId(id)
    try {
      await api.deleteConversation(id)
      setConversations((p) => p.filter((c) => c.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch { /* silent */ }
    finally { setDeletingId(null) }
  }

  const sortIcon = sortKey === 'oldest' || sortKey === 'az'
    ? <SortAsc className="size-3.5" />
    : <SortDesc className="size-3.5" />

  return (
    <div className="space-y-6">
      {/* ── header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Monitor</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Conversations</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            All customer chat threads routed through your RAG endpoint.
          </p>
        </div>
        <button
          onClick={load} disabled={loading}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <XCircle className="size-4" />{error}
        </div>
      )}

      {/* ── filter bar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        {/* search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/60"
          />
        </div>

        {/* date range */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="size-3.5 shrink-0" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/60"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>

        {/* sort */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {sortIcon}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/60"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">Title A → Z</option>
            <option value="za">Title Z → A</option>
          </select>
        </div>

        {/* result count */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="size-3.5" />
          <span>{filtered.length} of {conversations.length}</span>
        </div>
      </div>

      {/* ── two-panel layout ── */}
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">

        {/* ── left: list ── */}
        <aside className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              <span className="text-sm font-semibold">Threads</span>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {filtered.length}
            </span>
          </div>

          <div className="h-[620px] overflow-y-auto divide-y divide-border">
            {loading && (
              <div className="flex justify-center py-14">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="px-5 py-14 text-center text-sm text-muted-foreground">
                {search || dateRange !== 'all' ? 'No conversations match your filters.' : 'No conversations yet.'}
              </div>
            )}
            {!loading && filtered.map((conv) => {
              const active = selected?.id === conv.id
              return (
                <div
                  key={conv.id}
                  onClick={() => open(conv.id)}
                  className={`group flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors
                    ${active ? 'bg-primary/8 border-l-[3px] border-l-primary' : 'hover:bg-muted/40'}`}
                >
                  <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full transition-colors
                    ${active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                    <Bot className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium leading-snug">{conv.title}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3" />{relativeTime(conv.updated_at)}
                    </span>
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); del(conv.id) }}
                    disabled={deletingId === conv.id}
                    className="mt-0.5 shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
                    aria-label="Delete"
                  >
                    {deletingId === conv.id
                      ? <Loader2 className="size-3 animate-spin" />
                      : <Trash2 className="size-3" />}
                  </button>
                </div>
              )
            })}
          </div>
        </aside>

        {/* ── right: transcript ── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* empty */}
          {!selected && !transcriptLoading && !transcriptError && (
            <div className="flex h-[668px] flex-col items-center justify-center text-center">
              <span className="grid size-16 place-items-center rounded-2xl bg-primary/10">
                <MessageSquare className="size-7 text-primary" />
              </span>
              <p className="mt-4 text-sm font-semibold">Select a conversation</p>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-[220px]">Click any thread on the left to view its full transcript.</p>
            </div>
          )}

          {/* loading */}
          {transcriptLoading && (
            <div className="flex h-[668px] items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          )}

          {/* error */}
          {transcriptError && !transcriptLoading && (
            <div className="flex h-[668px] items-center justify-center px-8 text-center text-sm text-destructive">
              {transcriptError}
            </div>
          )}

          {/* content */}
          {selected && !transcriptLoading && (
            <div className="flex h-[668px] flex-col">
              {/* header */}
              <div className="flex items-center gap-3 border-b border-border px-5 py-4 shrink-0">
                <button
                  onClick={() => setSelected(null)}
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground lg:hidden"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold">{selected.title}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selected.messages.length} message{selected.messages.length !== 1 ? 's' : ''}
                    {' · '}{formatDate(selected.updated_at)}
                  </p>
                </div>
                <button
                  onClick={() => del(selected.id)}
                  disabled={deletingId === selected.id}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:border-destructive/40 hover:text-destructive disabled:opacity-50 transition-colors"
                >
                  {deletingId === selected.id
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <Trash2 className="size-3.5" />}
                  Delete
                </button>
              </div>

              {/* messages */}
              <div className="flex-1 overflow-y-auto space-y-4 p-5">
                {selected.messages.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">No messages in this conversation.</p>
                )}
                {selected.messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10">
                        <Bot className="size-4 text-primary" />
                      </span>
                    )}
                    <div className="max-w-[78%]">
                      <div className={`rounded-2xl px-4 py-3 text-sm
                        ${msg.role === 'user'
                          ? 'rounded-br-sm bg-primary text-primary-foreground'
                          : 'rounded-bl-sm bg-muted text-foreground'}`}
                      >
                        <MarkdownRenderer
                          content={msg.content}
                          variant={msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}
                        />
                      </div>
                      <div className={`mt-1.5 flex items-center gap-2 text-xs text-muted-foreground
                        ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <Clock className="size-3" />
                        {formatDate(msg.created_at)}
                        {msg.tokens_used ? <span className="rounded-full bg-muted px-1.5 py-0.5">{msg.tokens_used} tokens</span> : null}
                      </div>
                    </div>
                    {msg.role === 'user' && (
                      <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-muted">
                        <User className="size-4 text-muted-foreground" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
