'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Bot, Building2, CreditCard, LayoutDashboard, Plus, ShieldCheck } from 'lucide-react'

const links = [
  { href: '/admin', label: 'Command center', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Tenants', icon: Building2 },
  { href: '/admin/usage', label: 'Usage & limits', icon: BarChart3 },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/widgets', label: 'Widget control', icon: Bot },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25"><ShieldCheck className="size-4" /></span>
            <span><span className="block font-mono text-sm font-bold">vectorbase</span><span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-primary">Admin console</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 sm:block dark:text-emerald-400">All systems operational</span>
            <Link href="/admin/tenants/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"><Plus className="size-3.5" />New tenant</Link>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium ${pathname === href || (href === '/admin/tenants' && pathname.startsWith('/admin/tenants')) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}><Icon className="size-3.5" />{label}</Link>)}</nav>
      </header>
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="hidden w-60 shrink-0 border-r border-border px-3 py-7 lg:block">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Platform</p>
          <nav className="space-y-1">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${pathname === href || (href === '/admin/tenants' && pathname.startsWith('/admin/tenants')) ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon className="size-4" />{label}</Link>)}</nav>
          <div className="mt-8 rounded-xl border border-border bg-card p-3.5"><p className="text-xs font-semibold">Admin access</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Sensitive actions are recorded in the audit log.</p></div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-9 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
