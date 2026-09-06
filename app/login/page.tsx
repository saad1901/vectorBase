'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Database, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ApiError, api, extractSessionToken, saveSessionToken,
  saveTenantDashboard, saveTenantProfile, tenantProfileFromDashboard,
} from '@/lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('expired') === '1') {
      setError('Your session expired. Sign in again to continue.')
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.')
      return
    }
    setLoading(true)
    try {
      const session = await api.nonePost<unknown>(
        '/api/v1/auth/login',
        { email: email.trim(), password },
      )
      const token = extractSessionToken(session)
      if (!token) throw new Error('The API did not return a session token.')
      saveSessionToken(token)
      const dashboard = await api.tenantDashboard()
      saveTenantDashboard(dashboard)
      saveTenantProfile(tenantProfileFromDashboard(dashboard.profile))
      window.location.assign('/dashboard')
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message :
        caught instanceof Error   ? caught.message :
        'Could not sign in.',
      )
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 hero-wash dot-grid opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-primary/8 blur-3xl" />

      <div className="relative w-full max-w-[420px] animate-fade-up">
        {/* Card */}
        <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-black/8">
          {/* Top accent bar */}
          <div className="h-1 rounded-t-2xl bg-gradient-to-r from-primary via-violet-500 to-primary/60" />

          <div className="px-7 pt-8 pb-8 sm:px-8">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 w-fit">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                <Database className="size-4" />
              </span>
              <span className="font-mono text-sm font-bold tracking-tight text-foreground">vectorbase</span>
            </a>

            <div className="mt-8">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sign in to your knowledge base dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <FormField
                id="email"
                label="Work email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@company.com"
                autoComplete="email"
              />

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/70 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="flex items-center gap-1.5 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/20 mt-1">
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to vectorbase?{' '}
              <a href="/register" className="font-medium text-primary hover:underline underline-offset-4">
                Create an account
              </a>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          © 2026 vectorbase · Secure sign-in
        </p>
      </div>
    </main>
  )
}

function FormField({
  id, label, type = 'text', value, onChange, placeholder, autoComplete,
}: {
  id: string; label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder: string; autoComplete: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/70 transition-shadow"
      />
    </div>
  )
}
