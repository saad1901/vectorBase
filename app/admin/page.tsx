'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity, ArrowRight, Bot, Building2, Check, CheckCircle2,
  ChevronRight, Copy, CreditCard, Eye, EyeOff, Loader2,
  Plus, RefreshCw, ShieldCheck, XCircle, Zap,
} from 'lucide-react'
import { ApiError, api } from '@/lib/api'

// ─── Admin auth guard (local secret check) ────────────────────────────────────

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || ''

function useAdminAuth() {
  const [authed, setAuthed] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_authed')
    setAuthed(stored === 'yes')
    setChecked(true)
  }, [])

  function login(secret: string) {
    if (secret === ADMIN_SECRET) {
      sessionStorage.setItem('admin_authed', 'yes')
      setAuthed(true)
      return true
    }
    return false
  }

  function logout() {
    sessionStorage.removeItem('admin_authed')
    setAuthed(false)
  }

  return { authed, checked, login, logout }
}

// ─── Login gate ────────────────────────────────────────────────────────────────

function AdminLoginGate({ onLogin }: { onLogin: (secret: string) => boolean }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!onLogin(value.trim())) {
      setError('Invalid admin secret.')
      setValue('')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-violet-500 to-primary/60" />
          <div className="px-8 py-8">
            <div className="flex items-center gap-3 mb-8">
              <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="font-mono text-sm font-bold">vectorbase</p>
                <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">Admin console</p>
              </div>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Admin access required</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter the admin secret to continue.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Admin secret…"
                  autoFocus
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/70 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={!value.trim()}
                className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50 shadow-md shadow-primary/20"
              >
                Sign in to admin console
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

// ─── Health card ──────────────────────────────────────────────────────────────

type HealthStatus = 'checking' | 'ok' | 'error'

function HealthCard() {
  const [status, setStatus] = useState<HealthStatus>('checking')
  const [checked, setChecked] = useState<string | null>(null)

  async function check() {
    setStatus('checking')
    try {
      await api.noneGet('/syshealth')
      setStatus('ok')
    } catch {
      setStatus('error')
    }
    setChecked(new Date().toLocaleTimeString())
  }

  useEffect(() => { check() }, [])

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {status === 'checking' && <Loader2 className="size-5 animate-spin text-primary" />}
        {status === 'ok' && <CheckCircle2 className="size-5 text-emerald-600" />}
        {status === 'error' && <XCircle className="size-5 text-destructive" />}
        <div>
          <p className="text-sm font-semibold">
            {status === 'checking' ? 'Checking backend…' : status === 'ok' ? 'Backend reachable' : 'Backend unreachable'}
          </p>
          {checked && (
            <p className="text-xs text-muted-foreground">Last checked at {checked}</p>
          )}
        </div>
      </div>
      <button
        onClick={check}
        disabled={status === 'checking'}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
      >
        <RefreshCw className="size-3.5" />Recheck
      </button>
    </div>
  )
}

// ─── Create tenant form ───────────────────────────────────────────────────────

type CreatedTenant = { id: number; name: string; access_token: string; available_tokens: number }

function CreateTenantForm() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', company_name: '', phone: '', password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedTenant | null>(null)
  const [copied, setCopied] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const result = await api.adminPost<CreatedTenant>('/api/v1/tenant/create', {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        company_name: form.company_name.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
      })
      setCreated(result)
      setForm({ full_name: '', email: '', company_name: '', phone: '', password: '' })
      setOpen(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create tenant.')
    } finally { setLoading(false) }
  }

  async function copyToken() {
    if (!created?.access_token) return
    await navigator.clipboard.writeText(created.access_token)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Plus className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Create new tenant</p>
            <p className="text-xs text-muted-foreground">Provision a new organization with credentials</p>
          </div>
        </div>
        <ChevronRight className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <form onSubmit={submit} className="border-t border-border px-5 py-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name *" type="text" value={form.full_name} onChange={set('full_name')} placeholder="Alex Morgan" required />
            <Field label="Work email *" type="email" value={form.email} onChange={set('email')} placeholder="alex@company.com" required />
            <Field label="Company name *" type="text" value={form.company_name} onChange={set('company_name')} placeholder="Acme Inc." required />
            <Field label="Phone (optional)" type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" />
          </div>
          <Field label="Password * (min 8 chars)" type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" required />
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <XCircle className="size-4 shrink-0" />{error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="submit" disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50 shadow-sm shadow-primary/20"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Building2 className="size-4" />}
              {loading ? 'Creating…' : 'Create tenant'}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="h-10 rounded-xl border border-border px-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* One-time token modal */}
      {created && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Tenant created successfully</h2>
                <p className="text-xs text-muted-foreground">
                  #{created.id} · {created.name} · {created.available_tokens.toLocaleString()} tokens
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4 mb-4">
              <p className="text-xs font-semibold text-amber-800 mb-2">
                ⚠ Save this access token now — it will not be shown again.
              </p>
              <code className="block break-all rounded-lg bg-background px-3 py-3 text-sm font-mono">
                {created.access_token}
              </code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyToken}
                className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied!' : 'Copy token'}
              </button>
              <button
                onClick={() => setCreated(null)}
                className="h-10 rounded-xl border border-border px-4 text-sm text-muted-foreground hover:text-foreground"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder, required }: {
  label: string; type: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium">{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/60"
      />
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, tint }: {
  icon: React.ElementType; label: string; value: string; sub: string; tint: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <span className={`grid size-10 place-items-center rounded-xl ${tint}`}>
        <Icon className="size-4" />
      </span>
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-[11px] font-semibold text-emerald-600">{sub}</p>
    </div>
  )
}

// ─── Quick links ──────────────────────────────────────────────────────────────

const quickLinks = [
  { href: '/admin/tenants/new', icon: Plus,       label: 'New tenant',     desc: 'Provision a new organization' },
  { href: '/dashboard',         icon: ArrowRight, label: 'Tenant dashboard', desc: 'View the tenant-facing dashboard' },
  { href: '/api/v1/routerhealth', icon: Activity,  label: 'Router health',  desc: 'Raw FastAPI health endpoint' },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { authed, checked, login, logout } = useAdminAuth()
  const bars = [42, 54, 48, 69, 59, 83, 71, 92, 79, 88, 74, 96]

  if (!checked) return null // avoid flash

  if (!authed) return <AdminLoginGate onLogin={login} />

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-6">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">Platform intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Command center</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Platform health, tenant management, and key operations.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/tenants/new"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20"
          >
            <Plus className="size-3.5" />New tenant
          </Link>
          <button
            onClick={logout}
            className="h-9 rounded-xl border border-border px-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* System health */}
      <HealthCard />

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Building2}    label="Active tenants"     value="—"    sub="from backend" tint="text-primary bg-primary/10" />
        <StatCard icon={Activity}     label="Tokens processed"   value="—"    sub="from backend" tint="text-violet-600 bg-violet-500/10" />
        <StatCard icon={Zap}          label="Widget uptime"      value="—"    sub="from backend" tint="text-sky-600 bg-sky-500/10" />
        <StatCard icon={CreditCard}   label="MRR"                value="—"    sub="from backend" tint="text-emerald-600 bg-emerald-500/10" />
      </section>

      {/* Usage chart (visual placeholder) */}
      <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-base font-semibold">Usage trend</h2>
              <p className="mt-1 text-xs text-muted-foreground">Token consumption, last 12 periods</p>
            </div>
            <ShieldCheck className="size-4 text-primary" />
          </div>
          <div className="mt-7 flex h-44 items-end gap-2 sm:gap-3">
            {bars.map((h, i) => (
              <div key={i} className="flex h-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-md transition-all ${i === bars.length - 1 ? 'bg-primary' : 'bg-primary/25'}`}
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Create tenant inline */}
        <div className="space-y-4">
          <CreateTenantForm />
        </div>
      </section>

      {/* Quick links */}
      <section>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider font-mono text-[11px]">Quick access</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickLinks.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href} href={href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{desc}</p>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground ml-auto shrink-0 transition group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
