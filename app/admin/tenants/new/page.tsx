'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Copy, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { ApiError, api } from '@/lib/api'

type CreatedTenant = {
  id: number
  name: string
  access_token: string
  available_tokens: number
}

export default function NewTenantPage() {
  const [form, setForm] = useState({
    full_name: '', email: '', company_name: '', phone: '', password: '',
  })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [created, setCreated]   = useState<CreatedTenant | null>(null)
  const [copied, setCopied]     = useState(false)

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    try {
      const result = await api.adminPost<CreatedTenant>('/api/v1/tenant/create', {
        full_name:    form.full_name.trim(),
        email:        form.email.trim(),
        company_name: form.company_name.trim(),
        phone:        form.phone.trim() || null,
        password:     form.password,
      })
      setCreated(result)
      setForm({ full_name: '', email: '', company_name: '', phone: '', password: '' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create tenant.')
    } finally { setLoading(false) }
  }

  async function copyToken() {
    if (!created?.access_token) return
    await navigator.clipboard.writeText(created.access_token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* back */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="size-3.5" />Back to command center
      </Link>

      {/* heading */}
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Tenant provisioning</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create a tenant</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set up a new organization, workspace owner, and initial credentials.
        </p>
      </div>

      {/* form */}
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 sm:p-7 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner full name *" type="text"     value={form.full_name}    onChange={set('full_name')}    placeholder="Alex Morgan"        required />
          <Field label="Work email *"      type="email"    value={form.email}        onChange={set('email')}        placeholder="alex@company.com"   required />
          <Field label="Company name *"    type="text"     value={form.company_name} onChange={set('company_name')} placeholder="Acme Inc."          required />
          <Field label="Phone (optional)"  type="tel"      value={form.phone}        onChange={set('phone')}        placeholder="+1 555 000 0000" />
        </div>
        <Field label="Password * (min 8 chars)" type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" required />

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
            <XCircle className="size-4 shrink-0" />{error}
          </p>
        )}

        <button
          type="submit" disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50 shadow-sm shadow-primary/20"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? 'Creating tenant…' : 'Create tenant'}
        </button>
      </form>

      {/* one-time token display */}
      {created && (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-5 space-y-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div>
              <h2 className="font-semibold text-emerald-900 dark:text-emerald-300">Tenant created</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                #{created.id} · {created.name} · {created.available_tokens.toLocaleString()} initial tokens
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-xs text-amber-800">
            ⚠ Copy the access token below now — it will <strong>not</strong> be shown again.
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-3">
            <code className="min-w-0 flex-1 break-all text-xs font-mono">{created.access_token}</code>
            <button
              type="button" onClick={copyToken}
              className="shrink-0 grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Copy token"
            >
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCreated(null)}
              className="h-9 rounded-xl border border-border px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Create another
            </button>
            <Link
              href="/admin"
              className="inline-flex h-9 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Back to admin
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

function Field({
  label, type, value, onChange, placeholder, required,
}: {
  label: string; type: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/60 transition-shadow"
      />
    </div>
  )
}
