'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bot, BookOpen, Code2, Database, FileText, KeyRound,
  LayoutDashboard, LogOut, Menu, MessageSquare, Settings,
  Sparkles, UserRound, Wallet, X, ChevronRight,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  clearTenantSession, getTenantDashboard, getTenantProfile,
  getSessionToken, TenantDashboardStats,
} from '@/lib/api'

const nav = [
  { href: '/dashboard',               label: 'Overview',      icon: LayoutDashboard },
  { href: '/dashboard/documents',      label: 'Documents',     icon: FileText        },
  { href: '/dashboard/api-keys',       label: 'API keys',      icon: KeyRound        },
  { href: '/dashboard/playground',     label: 'Playground',    icon: Bot             },
  { href: '/dashboard/conversations',  label: 'Conversations', icon: MessageSquare   },
  { href: '/dashboard/integration',    label: 'Integration',   icon: Code2           },
  { href: '/dashboard/docs',           label: 'Docs',          icon: BookOpen        },
  { href: '/dashboard/profile',        label: 'Profile',       icon: UserRound       },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState({
    fullName: 'Workspace owner',
    email: 'owner@company.com',
    companyName: 'Customer workspace',
  })
  const [stats, setStats] = useState<TenantDashboardStats | null>(null)

  useEffect(() => {
    function sync() {
      const storedToken = window.localStorage.getItem('tenant_session_token')
      if (!getSessionToken()) {
        window.location.assign(storedToken ? '/login?expired=1' : '/login')
        return
      }
      const p = getTenantProfile()
      const d = getTenantDashboard()
      if (p) setProfile(p)
      if (d?.token_stats) setStats(d.token_stats)
    }
    sync()
    window.addEventListener('tenant-profile-updated', sync)
    window.addEventListener('tenant-dashboard-updated', sync)
    return () => {
      window.removeEventListener('tenant-profile-updated', sync)
      window.removeEventListener('tenant-dashboard-updated', sync)
    }
  }, [])

  function signOut() {
    clearTenantSession()
    window.location.assign('/login')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Desktop sidebar (fixed, out of flow) ──────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-[260px] lg:z-20 border-r border-sidebar-border bg-sidebar overflow-y-auto">
        <SidebarContent
          pathname={pathname}
          profile={profile}
          stats={stats}
          onSignOut={signOut}
        />
      </aside>

      {/* ── Everything to the right of the sidebar ────────────────────── */}
      <div className="lg:ml-[260px] flex flex-col min-h-screen">

        {/* Mobile topbar */}
        <header className="sticky top-0 z-30 lg:hidden border-b border-border bg-background/90 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 font-mono text-sm font-bold text-primary">
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="size-4" />
              </span>
              vectorbase
            </Link>
            <button
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
              className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="size-4" />
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        {open && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div className="fixed inset-y-0 left-0 z-50 flex flex-col w-[min(280px,90vw)] border-r border-sidebar-border bg-sidebar shadow-2xl lg:hidden overflow-y-auto">
              <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-sidebar-border">
                <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 font-mono text-sm font-bold text-sidebar-foreground">
                  <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
                    <Database className="size-3.5" />
                  </span>
                  vectorbase
                </Link>
                <button
                  aria-label="Close navigation"
                  onClick={() => setOpen(false)}
                  className="grid size-8 place-items-center rounded-md border border-sidebar-border text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent
                  pathname={pathname}
                  profile={profile}
                  stats={stats}
                  onSignOut={signOut}
                  onNavigate={() => setOpen(false)}
                />
              </div>
            </div>
          </>
        )}

        {/* Page content — full remaining width */}
        <main className="flex-1 w-full px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({
  pathname,
  profile,
  stats,
  onSignOut,
  onNavigate,
}: {
  pathname: string
  profile: { fullName: string; email: string; companyName: string }
  stats: TenantDashboardStats | null
  onSignOut: () => void
  onNavigate?: () => void
}) {
  const usagePercent = Math.max(0, Math.min(100, stats?.usage_percentage || 0))
  const usageColor =
    usagePercent >= 90 ? 'bg-red-500' :
    usagePercent >= 70 ? 'bg-amber-500' :
    'bg-primary'

  return (
    <div className="flex min-h-full flex-col gap-1 px-3 py-4">

      {/* Brand mark */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl hover:bg-sidebar-accent/60 transition-colors"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
          <Database className="size-4" />
        </span>
        <span>
          <span className="block font-mono text-sm font-bold tracking-tight text-sidebar-foreground">vectorbase</span>
          <span className="block text-[11px] text-muted-foreground">RAG control plane</span>
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5">
        <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Workspace
        </p>
        {nav.map((item) => {
          const active = item.href === '/dashboard'
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className={`size-4 shrink-0 transition-transform duration-150 ${active ? '' : 'group-hover:scale-110'}`} />
              <span className="flex-1 truncate">{item.label}</span>
              {active && <ChevronRight className="size-3 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Token usage */}
      <div className="mx-1 mb-2 rounded-xl border border-sidebar-border bg-background/50 p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-sidebar-foreground">
            <Wallet className="size-3.5 text-primary" />
            Token usage
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">{usagePercent.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-sidebar-border overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${usageColor}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{formatCompact(stats?.total_tokens_used)} used</span>
          <span>{formatCompact(stats?.total_tokens_purchased)} total</span>
        </div>
      </div>

      {/* User card */}
      <div className="mx-1 space-y-2">
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-background/50 p-3 hover:bg-sidebar-accent/50 transition-colors"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
            {initials(profile.fullName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-sidebar-foreground">{profile.fullName}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{profile.companyName}</span>
          </span>
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/dashboard/profile"
            onClick={onNavigate}
            className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-sidebar-border text-[11px] font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <Settings className="size-3" />Settings
          </Link>
          <button
            onClick={onSignOut}
            className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-sidebar-border text-[11px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <LogOut className="size-3" />Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'VB'
}

function formatCompact(value: number | undefined) {
  if (!value) return '0'
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
