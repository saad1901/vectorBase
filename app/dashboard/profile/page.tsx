'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Bell, Building2, CheckCircle2, Save, Shield, UserRound } from 'lucide-react'
import { getTenantProfile, saveTenantProfile, TenantProfile } from '@/lib/api'

const fallbackProfile: TenantProfile = {
  fullName: 'Workspace owner',
  email: 'owner@company.com',
  companyName: 'Customer workspace',
  phone: '',
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<TenantProfile>(fallbackProfile)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setProfile(getTenantProfile() || fallbackProfile)
  }, [])

  function update(field: keyof TenantProfile) {
    return (event: React.ChangeEvent<HTMLInputElement>) => setProfile((current) => ({ ...current, [field]: event.target.value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveTenantProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Profile</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Manage the workspace owner identity, company details, notifications, and access controls.</p>
      </div>

      {saved && <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 className="size-4" />Profile saved locally.</div>}

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary"><UserRound className="size-5" /></span>
            <div><h2 className="font-semibold">Owner details</h2><p className="mt-1 text-sm text-muted-foreground">These fields can later sync with your profile endpoint.</p></div>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <label className="text-sm font-medium">Full name<input value={profile.fullName} onChange={update('fullName')} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
            <label className="text-sm font-medium">Work email<input type="email" value={profile.email} onChange={update('email')} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
            <label className="text-sm font-medium">Company<input value={profile.companyName} onChange={update('companyName')} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
            <label className="text-sm font-medium">Phone<input value={profile.phone || ''} onChange={update('phone')} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
          </div>
          <div className="border-t border-border p-5">
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"><Save className="size-4" />Save profile</button>
          </div>
        </form>

        <div className="space-y-4">
          <Panel icon={<Building2 />} title="Workspace" rows={[['Plan', 'Developer'], ['Region', 'Local / self-hosted'], ['Vector namespace', 'production']]} />
          <Panel icon={<Shield />} title="Security" rows={[['Session auth', 'JWT active'], ['Client API keys', 'Managed separately'], ['CORS', 'Browser allowed']]} />
          <Panel icon={<Bell />} title="Notifications" rows={[['Low balance alerts', 'Enabled'], ['Failed ingestion', 'Enabled'], ['Weekly usage report', 'Friday']]} />
        </div>
      </section>
    </div>
  )
}

function Panel({ icon, title, rows }: { icon: React.ReactNode; title: string; rows: Array<[string, string]> }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 font-semibold text-sm"><span className="text-primary">{icon}</span>{title}</div>
      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
