'use client'

import { useState } from 'react'
import {
  ArrowRight, BarChart3, Check, ChevronDown, Database,
  FileText, Menu, Play, ShieldCheck, Sparkles, X, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ── Data ───────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Database,
    title: 'Production-ready RAG',
    text:  'Ground every support answer in your docs, help center, policies, and product knowledge.',
    badge: 'Retrieval',
  },
  {
    icon: Sparkles,
    title: 'Customer support agent',
    text:  'Give customers instant, on-brand answers 24/7 with seamless human escalation.',
    badge: 'Automation',
  },
  {
    icon: BarChart3,
    title: 'Actionable reports',
    text:  'Track resolution rate, unanswered questions, citations, latency, cost, and satisfaction.',
    badge: 'Analytics',
  },
]

const faqs: [string, string][] = [
  ['What is vectorbase?',
   'An end-to-end knowledge layer for teams building reliable AI assistants with retrieval-augmented generation.'],
  ['Can we use our own model?',
   'Yes. Connect any model provider and generation settings; vectorbase handles retrieval and observability.'],
  ['How fast can we launch?',
   'Most teams go from their first document to a live, cited chatbot in an afternoon.'],
]

const steps = [
  ['01', 'Connect your sources',    "Upload PDFs, docs, and support content. Namespaces keep every tenant's knowledge isolated."],
  ['02', 'Tune your retrieval',     'Test queries in the playground, inspect citations, and adjust settings without guesswork.'],
  ['03', 'Embed your assistant',    'Add a lightweight chatbot to your product with your brand, your prompt, and your API key.'],
  ['04', 'Measure what matters',    'Reports for usage, latency, costs, retrieval quality, and customer satisfaction.'],
]

const pricingPlans = [
  { name: 'Starter', tokens: '10M', price: '₹249', description: 'For prototypes and small support teams.', featured: false },
  { name: 'Growth', tokens: '25M', price: '₹449', description: 'For growing customer-facing assistants.', featured: true },
  { name: 'Scale', tokens: '50M', price: '₹799', description: 'For high-volume knowledge workflows.', featured: false },
]

const tokenAddOn = { tokens: '1M', price: '₹29', description: 'Add extra capacity in repeatable 1M-token units.' }

/* ── Shared components ───────────────────────────────────────────────────── */
function Logo() {
  return (
    <a href="/" className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <Database className="size-4" />
      </span>
      <span className="font-mono text-sm font-bold tracking-tight">vectorbase</span>
    </a>
  )
}

/* ── Nav ─────────────────────────────────────────────────────────────────── */
function MarketingNav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {['#support-agent', '#workflow', '#reports', '#pricing', '#faq'].map((href, i) =>
            <a key={href} href={href} className="hover:text-foreground transition-colors">
              {['Support agent', 'How it works', 'Reports', 'Pricing', 'FAQ'][i]}
            </a>
          )}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <a href="/login" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</a>
          <Button asChild size="sm" className="rounded-lg shadow-sm shadow-primary/20">
            <a href="/register">Get started free</a>
          </Button>
        </div>
        <button className="grid size-9 place-items-center rounded-lg border border-border md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-border bg-card/95 backdrop-blur-sm px-5 py-5 md:hidden">
          <div className="flex flex-col gap-4 text-sm">
            {[['#support-agent','Support agent'],['#workflow','How it works'],['#reports','Reports'],['#pricing','Pricing'],['#faq','FAQ']].map(([href, label]) =>
              <a key={href} href={href} onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">{label}</a>
            )}
            <hr className="border-border" />
            <a href="/login" className="text-muted-foreground hover:text-foreground">Sign in</a>
            <Button asChild className="w-full rounded-lg"><a href="/register">Get started free</a></Button>
          </div>
        </nav>
      )}
    </header>
  )
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Background wash + grid */}
      <div className="absolute inset-0 hero-wash" />
      <div className="absolute inset-0 dot-grid opacity-40" />
      {/* Glow blob */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-[700px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        {/* Copy */}
        <div className="animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 font-mono text-[11px] font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Custom AI support chatbots — powered by your APIs
          </div>
          <h1 className="max-w-3xl text-balance text-5xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-6xl xl:text-7xl">
            Launch a support chatbot built for{' '}
            <span className="gradient-text">your business.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Connect your product APIs and knowledge base to vectorbase. We provide the AI customer-support
            layer that answers questions, retrieves the right information, and hands off to your team when needed.
          </p>
          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="w-full rounded-xl shadow-lg shadow-primary/25 sm:w-auto">
              <a href="/register">Start building free <ArrowRight className="ml-2 size-4" /></a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full rounded-xl sm:w-auto">
              <a href="#platform"><Play className="mr-2 size-4" />See the platform</a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><Check className="size-3.5 text-primary" />No credit card required</span>
            <span className="flex items-center gap-2"><Check className="size-3.5 text-primary" />Live in minutes</span>
            <span className="flex items-center gap-2"><Check className="size-3.5 text-primary" />Your data stays yours</span>
          </div>
        </div>

        {/* Chat card mockup */}
        <div className="relative mx-auto w-full max-w-sm lg:max-w-full animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="rounded-2xl border border-border bg-card p-3 shadow-2xl glow-primary">
            <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <Sparkles className="size-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold">Acme Assistant</p>
                    <p className="text-[10px] text-muted-foreground">Powered by vectorbase</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-500">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />online
                </span>
              </div>
              <div className="space-y-3.5 py-5">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-xs leading-5">
                  How do I update workspace permissions?
                </div>
                <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-xs leading-5 text-primary-foreground">
                  Admins can update permissions from{' '}
                  <span className="font-mono text-[10px] rounded bg-white/15 px-1">Settings → Members</span>.
                  You'll need an Admin role to make changes.
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
                <span>Ask your knowledge base…</span>
                <span className="grid size-6 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <ArrowRight className="size-3" />
                </span>
              </div>
            </div>
          </div>
          {/* Floating stat */}
          <div className="absolute -bottom-4 -left-4 hidden sm:block rounded-xl border border-border bg-card px-4 py-3 shadow-xl">
            <p className="font-mono text-xl font-bold gradient-text">99%</p>
            <p className="text-[10px] text-muted-foreground">satisfaction rate</p>
          </div>
          <div className="absolute -top-4 -right-4 hidden sm:block rounded-xl border border-border bg-card px-4 py-3 shadow-xl">
            <p className="font-mono text-xl font-bold gradient-text">218ms</p>
            <p className="text-[10px] text-muted-foreground">avg response</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Support demos ───────────────────────────────────────────────────────── */
function SupportDemos() {
  const demos = [
    {
      icon: Sparkles,
      title: 'Product support',
      q: 'How do I reset my workspace API key?',
      a: 'Open Settings → API Keys, select the key, then choose Rotate secret. Your existing key stays active until you confirm.',
      source: 'API key management · 98% confidence',
    },
    {
      icon: Database,
      title: 'Troubleshooting',
      q: 'My webhook keeps returning a 401. What should I check?',
      a: 'Verify the Bearer token, confirm the endpoint is enabled for your environment, and check that your server reads the Authorization header.',
      source: 'Webhook authentication · 94% confidence',
    },
    {
      icon: ShieldCheck,
      title: 'Smart escalation',
      q: 'I was charged twice for my subscription.',
      a: "I can route this to billing now. I've collected the conversation context so a specialist can review it without making you repeat yourself.",
      source: 'Escalated to Billing · Priority high',
    },
  ]

  return (
    <section id="support-agent" className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">Your 24/7 support agent</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Answers that resolve issues, <br className="hidden sm:block" />not just questions.
          </h2>
          <p className="mt-4 text-pretty leading-7 text-muted-foreground">
            Turn your existing knowledge into a support teammate that can understand intent, cite the right source, guide troubleshooting, and hand off complex cases.
          </p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {demos.map(({ icon: Icon, title, q, a, source }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-5 shadow-sm card-hover">
              <div className="flex items-center gap-2.5 border-b border-border pb-4">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">Example conversation</p>
                </div>
              </div>
              <div className="space-y-3.5 pt-5 text-sm">
                <div className="ml-6 rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-foreground leading-5">{q}</div>
                <div className="rounded-2xl rounded-tl-sm bg-primary/10 px-4 py-3 leading-6 text-foreground">
                  <span className="font-semibold text-primary">Support agent</span><br />
                  {a}
                  <p className="mt-2.5 border-t border-primary/15 pt-2.5 text-xs text-muted-foreground">{source}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          {['Answers from your trusted sources', 'Human handoff for edge cases', 'Branded to match your product'].map((t) => (
            <span key={t} className="flex items-center gap-2"><Check className="size-3.5 text-emerald-500" />{t}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Platform features ───────────────────────────────────────────────────── */
function Platform() {
  return (
    <section id="platform" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">What you get</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Everything to ship helpful support.</h2>
        <p className="mt-4 text-pretty leading-7 text-muted-foreground">
          No stitching five tools together. One platform, from knowledge ingestion to live widget.
        </p>
      </div>
      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
        {features.map(({ icon: Icon, title, text, badge }) => (
          <article key={title} className="bg-card p-7 sm:p-8 group">
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                <Icon className="size-5" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border border-border rounded-full px-2.5 py-0.5">{badge}</span>
            </div>
            <h3 className="mt-7 text-lg font-semibold">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
            <a href="/register" className="mt-7 inline-flex items-center text-xs font-semibold text-primary group-hover:gap-2 gap-1.5 transition-all">
              Explore feature <ArrowRight className="size-3.5" />
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ── Workflow ────────────────────────────────────────────────────────────── */
function Workflow() {
  return (
    <section id="workflow" className="border-y border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">How it works</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Launch once. Learn from every answer.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">A thoughtful workflow for teams that care about quality as much as speed.</p>
            <Button asChild className="mt-8 rounded-xl shadow-md shadow-primary/20">
              <a href="/register">Start building <ArrowRight className="ml-2 size-4" /></a>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map(([number, title, text]) => (
              <article key={number} className="group rounded-2xl border border-border bg-background p-6 card-hover">
                <p className="font-mono text-2xl font-bold gradient-text">{number}</p>
                <h3 className="mt-6 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Reports ─────────────────────────────────────────────────────────────── */
function Reports() {
  const bars = [34, 42, 38, 55, 49, 63, 58, 72, 68, 79, 74, 88, 82, 94]
  return (
    <section id="reports" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">Visibility by default</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Know why your assistant works.</h2>
          <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
            Reports turn every interaction into a signal. See where users get answers, where retrieval misses, and what to improve next.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            {[
              [ShieldCheck, 'emerald', 'Tenant-safe by design.', 'Keep workspaces, keys, and data cleanly separated.'],
              [Zap,         'primary', 'Fast enough for real products.', 'Monitor response times and token spend at a glance.'],
              [FileText,    'primary', 'Citations users can trust.', 'Make sources visible and answers verifiable.'],
            ].map(([Icon, color, strong, rest]: any) => (
              <li key={strong} className="flex gap-3">
                <Icon className={`mt-0.5 size-4 shrink-0 text-${color}-500`} />
                <span>
                  <strong className="font-semibold">{strong}</strong>
                  <span className="ml-1 text-muted-foreground">{rest}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        {/* Chart card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl glow-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Knowledge performance</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <BarChart3 className="size-5 text-primary" />
          </div>
          <div className="mt-8 flex h-44 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm transition-all duration-500"
                style={{
                  height: `${h}%`,
                  background: `oklch(${0.52 + (h / 100) * 0.15} 0.22 263 / ${0.5 + (h / 100) * 0.5})`,
                }}
              />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5">
            {[['99.1%','satisfaction'],['218ms','avg latency'],['94.8%','answer rate']].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="font-mono text-xl font-bold gradient-text">{val}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── FAQ ─────────────────────────────────────────────────────────────────── */
function FAQ() {
  const [active, setActive] = useState(0)
  return (
    <section id="faq" className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">Questions, answered</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Start with confidence.</h2>
        </div>
        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
          {faqs.map(([question, answer], i) => (
            <div key={question}>
              <button
                onClick={() => setActive(active === i ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm font-medium hover:bg-muted/40 transition-colors"
              >
                <span>{question}</span>
                <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${active === i ? 'rotate-180' : ''}`} />
              </button>
              {active === i && (
                <p className="max-w-2xl px-6 pb-5 text-sm leading-6 text-muted-foreground animate-fade-up">{answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── CTA ─────────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="border-t border-border relative overflow-hidden">
      <div className="absolute inset-0 hero-wash dot-grid opacity-50" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-[600px] rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-4xl px-5 py-24 text-center sm:px-8 sm:py-32">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">Give customers answers, not waiting rooms</p>
        <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
          Turn your knowledge into a{' '}
          <span className="gradient-text">helpful support experience.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl leading-7 text-muted-foreground">
          Build a more useful assistant with the infrastructure your product should have had from day one.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="w-full rounded-xl shadow-xl shadow-primary/25 sm:w-auto">
            <a href="/register">Start building free <ArrowRight className="ml-2 size-4" /></a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full rounded-xl sm:w-auto">
            <a href="/login">Sign in to dashboard</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
    
function Pricing() {
  return (
    <section id="pricing" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">Simple token pricing</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Choose room to grow.</h2>
          <p className="mt-6 leading-7 text-muted-foreground">Start small, then add the capacity your support workload needs. Every plan includes the complete vectorbase platform.</p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm ${plan.featured ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}>
              {plan.featured && <span className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">Most popular</span>}
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="mt-4 text-4xl font-bold tracking-tight">{plan.tokens}</p>
              <p className="mt-1 text-xs text-muted-foreground">tokens per top-up</p>
              <p className="mt-5 min-h-10 text-sm leading-5 text-muted-foreground">{plan.description}</p>
              <div className="mt-6 border-t border-border pt-5"><span className="text-2xl font-semibold">{plan.price}</span><span className="ml-2 text-xs text-muted-foreground">one-time</span></div>
              <a href="/register" className={`mt-7 inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors ${plan.featured ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-border bg-background hover:bg-muted'}`}>Get started</a>
            </article>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">Flexible top-up</p>
            <p className="mt-2 font-semibold">Need more capacity between plans?</p>
            <p className="mt-1 text-sm text-muted-foreground">Buy additional tokens repeatedly in 1M-token units.</p>
          </div>
          <a href="/register" className="inline-flex h-10 items-center justify-center rounded-xl border border-primary/30 bg-background px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10 sm:shrink-0">Add {tokenAddOn.tokens} for {tokenAddOn.price}</a>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">Need a custom volume? Contact us for a tailored plan.</p>
      </div>
    </section>
  )
}

/* ── CTA ────────────────────────────────────────────────────────────────── */

/* ── Footer ──────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo />
        <div className="flex flex-wrap gap-5">
          <a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
          <a href="/widget"    className="hover:text-foreground transition-colors">Demo widget</a>
          <a href="mailto:hello@vectorbase.dev" className="hover:text-foreground transition-colors">Contact</a>
        </div>
        <p>© 2026 vectorbase</p>
      </div>
    </footer>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function Page() {
  return (
    <>
      <MarketingNav />
      <main>
        <Hero />
        <SupportDemos />
        <Platform />
        <Workflow />
        <Reports />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
