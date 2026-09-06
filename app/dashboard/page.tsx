'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity, ArrowRight, Bot, Clock, Database, FileText,
  KeyRound, Loader2, MessageSquareText, RefreshCw, ShieldCheck,
  Sliders, Sparkles, Wallet, XCircle, Zap,
} from 'lucide-react'
import {
  ApiError, api,
  clearTenantSession, getSessionToken,
  getTenantDashboard, getTenantProfile,
  isExpiredSessionError,
  saveTenantDashboard, saveTenantProfile,
  TenantDashboardResponse, tenantProfileFromDashboard,
} from '@/lib/api'

const number = (value: unknown) => Number(value || 0).toLocaleString()
const percent = (value: unknown) => `${Number(value || 0).toFixed(1)}%`

function formatDate(value: string | null | undefined) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<TenantDashboardResponse | null>(null)
  const [profile, setProfile] = useState<ReturnType<typeof getTenantProfile>>(null)
  const [hasSession, setHasSession] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const stats = dashboard?.token_stats
  const billings = dashboard?.recent_billings || []
  const displayName = dashboard?.profile.company_name || profile?.companyName || 'Customer workspace'

  function redirectToLogin(expired = false) {
    clearTenantSession()
    window.location.assign(expired ? '/login?expired=1' : '/login')
  }

  async function load() {
    const token = getSessionToken()
    if (!token) { redirectToLogin(); return }
    setLoading(true)
    setError('')
    try {
      const nextDashboard = await api.tenantDashboard()
      setDashboard(nextDashboard)
      setProfile(tenantProfileFromDashboard(nextDashboard.profile))
      saveTenantDashboard(nextDashboard)
      saveTenantProfile(tenantProfileFromDashboard(nextDashboard.profile))
    } catch (caught) {
      if (isExpiredSessionError(caught)) { redirectToLogin(true); return }
      setError(caught instanceof ApiError ? caught.message : 'Could not load workspace overview.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setDashboard(getTenantDashboard())
    setProfile(getTenantProfile())
    setHasSession(Boolean(getSessionToken()))
    load()
  }, [])

  const usagePct = stats ? Math.min(100, Math.max(0, stats.usage_percentage)) : 0
  const isLowBalance = stats ? stats.available_tokens <= 1000 : false

  return (
    <div className="space-y-8">
      {/* ── Workspace Header Banner ── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Workspace overview</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              isLowBalance
                ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
            }`}>
              <span className={`size-1.5 rounded-full ${isLowBalance ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              {isLowBalance ? 'Low Token Balance' : 'Active Workspace'}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">{displayName}</h1>
          <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Monitor real-time token usage, access AI widget code snippets, manage knowledge base docs, and test chatbot RAG behavior.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-xs"
          >
            <RefreshCw className={`size-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link href="/dashboard/playground">
            <button className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
              <Zap className="size-3.5" />
              Test Playground
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          <XCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Key Metrics Cards ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Available Tokens */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Available Tokens</span>
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Wallet className="size-4" />
            </span>
          </div>
          <div>
            <p className={`text-2xl font-bold tracking-tight ${isLowBalance ? 'text-rose-600' : 'text-foreground'}`}>
              {stats ? number(Math.max(0, stats.available_tokens)) : '...'}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Ready for active chat traffic</p>
          </div>
        </div>

        {/* Tokens Used */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tokens Used</span>
            <span className="grid size-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600">
              <Activity className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {stats ? number(stats.total_tokens_used) : '...'}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Across all chat sessions</p>
          </div>
        </div>

        {/* Tokens Purchased */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tokens Purchased</span>
            <span className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <Database className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {stats ? number(stats.total_tokens_purchased) : '...'}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Lifetime token credits added</p>
          </div>
        </div>

        {/* Usage Rate Bar */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Usage Percentage</span>
            <span className="grid size-9 place-items-center rounded-xl bg-violet-500/10 text-violet-600">
              <Bot className="size-4" />
            </span>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>{stats ? percent(stats.usage_percentage) : '...'}</span>
              <span className="text-[10px] text-muted-foreground font-normal">Purchased tokens used</span>
            </div>
            <div className="mt-2.5 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500 rounded-full"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Launch Pad Hub ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Interactive Launch Pad
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quickly navigate to configure, integrate, test, and manage your AI chatbot workspace.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: API Keys & Tuning */}
          <Link href="/dashboard/api-keys" className="group block">
            <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <KeyRound className="size-5" />
                </span>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  API Keys &amp; Model Tuning
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Generate keys, configure system prompt overrides, select RAG strictness, and set domain CORS locks.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 2: Widget Integration & AI */}
          <Link href="/dashboard/integration" className="group block">
            <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <Zap className="size-5" />
                </span>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-violet-600 transition-colors">
                  Widget &amp; AI Integration
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Get embed script tags and copy pre-built AI prompts for Cursor, VS Code, Copilot, Kiro, and Lovable.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 3: Knowledge Base Documents */}
          <Link href="/dashboard/documents" className="group block">
            <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText className="size-5" />
                </span>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                  Knowledge Base Docs
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Upload PDFs, docx files, and text documents to automatically generate chunk embeddings for RAG search.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 4: Chat Playground */}
          <Link href="/dashboard/playground" className="group block">
            <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <MessageSquareText className="size-5" />
                </span>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                  Live Chat Playground
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Test chatbot responses, inspect cited sources, and refine AI parameters interactively in real time.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Recent Billing & Transactions Table ── */}
      <section className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="border-b border-border p-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base text-foreground">Recent Billings &amp; Credits</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Token purchase history and transactions.</p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-primary">
            {billings.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Tokens Added</th>
                <th className="px-5 py-3">Amount Paid</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {billings.map((b) => (
                <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                  <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">{formatDate(b.created_at)}</td>
                  <td className="px-5 py-3.5 font-semibold text-foreground">{number(b.tokens_added)} tokens</td>
                  <td className="px-5 py-3.5 font-medium text-foreground">{number(b.amount_paid)} {b.currency || 'USD'}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-500/20">
                      {b.status || 'Paid'}
                    </span>
                  </td>
                </tr>
              ))}
              {!billings.length && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-xs text-muted-foreground">
                    No billing records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
