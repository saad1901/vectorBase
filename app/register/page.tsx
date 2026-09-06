'use client'

import { FormEvent, useState } from 'react'
import { Database, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ApiError, api, extractSessionToken, saveSessionToken,
  saveTenantDashboard, saveTenantProfile, tenantProfileFromDashboard,
} from '@/lib/api'

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', companyName: '',
    contactNumber: '', password: '', confirmPassword: '',
  })
  const [showPw, setShowPw]         = useState(false)
  const [showConfPw, setShowConfPw] = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.companyName.trim() || form.password.length < 8) {
      setError('Provide your full name, work email, company name, and a password of at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.adminPost<Record<string, unknown>>('/api/v1/tenant/create', {
        full_name:    form.name.trim(),
        email:        form.email.trim(),
        company_name: form.companyName.trim(),
        phone:        form.contactNumber.trim() || undefined,
        password:     form.password,
      })
      saveTenantProfile({
        fullName:    form.name.trim(),
        email:       form.email.trim(),
        companyName: form.companyName.trim(),
        phone:       form.contactNumber.trim() || undefined,
      })
      const session = await api.nonePost<unknown>(
        '/api/v1/auth/login',
        { email: form.email.trim(), password: form.password },
      )
      const token = extractSessionToken(session)
      if (token) {
        saveSessionToken(token)
        const dashboard = await api.tenantDashboard()
        saveTenantDashboard(dashboard)
        saveTenantProfile(tenantProfileFromDashboard(dashboard.profile))
      }
      window.location.assign('/dashboard')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not create your account. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 hero-wash dot-grid opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-primary/8 blur-3xl" />

      <div className="relative w-full max-w-[460px] animate-fade-up">
        <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-black/8">
          <div className="h-1 rounded-t-2xl bg-gradient-to-r from-primary via-violet-500 to-primary/60" />

          <div className="px-7 pt-8 pb-8 sm:px-8">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 w-fit">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                <Database className="size-4" />
              </span>
              <span className="font-mono text-sm font-bold tracking-tight">vectorbase</span>
            </a>

            <div className="mt-8">
              <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Start building your custom AI support chatbot.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="name" label="Full name" value={form.name} onChange={update('name')} placeholder="Alex Morgan" autoComplete="name" />
                <Field id="email" label="Work email" type="email" value={form.email} onChange={update('email')} placeholder="you@company.com" autoComplete="email" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="companyName" label="Company name" value={form.companyName} onChange={update('companyName')} placeholder="Acme Inc." autoComplete="organization" />
                <Field id="contactNumber" label="Phone (optional)" type="tel" value={form.contactNumber} onChange={update('contactNumber')} placeholder="+1 555 000 0000" autoComplete="tel" />
              </div>

              {/* Password */}
              <PasswordField
                id="password" label="Password"
                value={form.password} onChange={update('password')}
                placeholder="At least 8 characters"
                show={showPw} onToggle={() => setShowPw((v) => !v)}
                autoComplete="new-password"
              />
              <PasswordField
                id="confirmPassword" label="Confirm password"
                value={form.confirmPassword} onChange={update('confirmPassword')}
                placeholder="Re-enter your password"
                show={showConfPw} onToggle={() => setShowConfPw((v) => !v)}
                autoComplete="new-password"
              />

              {error && (
                <p role="alert" className="flex items-start gap-1.5 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/20 mt-1">
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-primary hover:underline underline-offset-4">Sign in</a>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          © 2026 vectorbase · Your data stays yours
        </p>
      </div>
    </main>
  )
}

function Field({
  id, label, type = 'text', value, onChange, placeholder, autoComplete,
}: {
  id: string; label: string; type?: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string; autoComplete: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/70 transition-shadow"
      />
    </div>
  )
}

function PasswordField({
  id, label, value, onChange, placeholder, show, onToggle, autoComplete,
}: {
  id: string; label: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string; show: boolean; onToggle: () => void; autoComplete: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/70 transition-shadow"
        />
        <button
          type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  )
}
