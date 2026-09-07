'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Braces, Check, Code2, Copy,
  Clock3, Database, KeyRound, MessageSquareText, ShieldCheck,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const CDN_SCRIPT = process.env.NEXT_PUBLIC_WIDGET_LINK || 'https://vector-base.b-cdn.net/widget.js'

type WidgetBuild = { id: string; label: string; url: string }

const configuredWidgetBuilds = [
  ['A', process.env.NEXT_PUBLIC_WIDGET_A], ['B', process.env.NEXT_PUBLIC_WIDGET_B],
  ['C', process.env.NEXT_PUBLIC_WIDGET_C], ['D', process.env.NEXT_PUBLIC_WIDGET_D],
  ['E', process.env.NEXT_PUBLIC_WIDGET_E], ['F', process.env.NEXT_PUBLIC_WIDGET_F],
  ['G', process.env.NEXT_PUBLIC_WIDGET_G], ['H', process.env.NEXT_PUBLIC_WIDGET_H],
  ['I', process.env.NEXT_PUBLIC_WIDGET_I], ['J', process.env.NEXT_PUBLIC_WIDGET_J],
  ['K', process.env.NEXT_PUBLIC_WIDGET_K], ['L', process.env.NEXT_PUBLIC_WIDGET_L],
  ['M', process.env.NEXT_PUBLIC_WIDGET_M], ['N', process.env.NEXT_PUBLIC_WIDGET_N],
  ['O', process.env.NEXT_PUBLIC_WIDGET_O], ['P', process.env.NEXT_PUBLIC_WIDGET_P],
  ['Q', process.env.NEXT_PUBLIC_WIDGET_Q], ['R', process.env.NEXT_PUBLIC_WIDGET_R],
  ['S', process.env.NEXT_PUBLIC_WIDGET_S], ['T', process.env.NEXT_PUBLIC_WIDGET_T],
  ['U', process.env.NEXT_PUBLIC_WIDGET_U], ['V', process.env.NEXT_PUBLIC_WIDGET_V],
  ['W', process.env.NEXT_PUBLIC_WIDGET_W], ['X', process.env.NEXT_PUBLIC_WIDGET_X],
  ['Y', process.env.NEXT_PUBLIC_WIDGET_Y], ['Z', process.env.NEXT_PUBLIC_WIDGET_Z],
].flatMap(([id, url]) => url ? [{ id, label: `Widget ${id}`, url }] : []) as WidgetBuild[]

const WIDGET_BUILDS: WidgetBuild[] = configuredWidgetBuilds.length
  ? configuredWidgetBuilds
  : [{ id: 'default', label: 'Default widget', url: CDN_SCRIPT }]

function embedSnippet(widgetUrl: string, apiKey: string) {
  return `<!-- VectorBase AI Chatbot Embed -->
<script
  src="${widgetUrl}"
  data-api-key="${apiKey}"
  defer>
</script>`
}

export default function IntegrationPage() {
  const [integrationType, setIntegrationType] = useState<'widget' | 'custom' | 'mcp' | 'rag'>('widget')
  const [apiKey, setApiKey] = useState('')
  const [selectedWidgetId, setSelectedWidgetId] = useState(WIDGET_BUILDS[0]?.id || '')
  const [previewWidgetId, setPreviewWidgetId] = useState(WIDGET_BUILDS[0]?.id || '')
  const [snippetCopied, setSnippetCopied] = useState(false)

  const [customCopied, setCustomCopied] = useState<'request' | 'conversation' | 'token' | null>(null)

  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const snippetKeyValue = apiKey.trim() || 'YOUR_PUBLIC_API_KEY'
  const selectedWidget = WIDGET_BUILDS.find((build) => build.id === selectedWidgetId) || WIDGET_BUILDS[0]

  const snippet = embedSnippet(selectedWidget.url, snippetKeyValue)
  const snippetLines = snippet.split('\n')

  const customRequest = `const response = await fetch('${API_URL}/api/v1/chat/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.VECTORBASE_API_KEY
  },
  body: JSON.stringify({
    query: 'Where is my order?',
    use_rag: true,
    use_history: true
  })
})

const { conversation_id, response: answer } = await response.json()`

  const conversationRequest = `// Start a conversation
const first = await ask('What is your return policy?')

// Keep the returned ID for every follow-up in this thread
const followUp = await fetch('${API_URL}/api/v1/chat/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.VECTORBASE_API_KEY },
  body: JSON.stringify({
    query: 'Does that include damaged items?',
    conversation_id: first.conversation_id,
    use_rag: true,
    use_history: true
  })
})`

  const sessionTokenRequest = `// Run this on your server — never expose the long-lived key in a browser.
const session = await fetch('${API_URL}/api/v1/auth/session', {
  method: 'POST',
  headers: { 'X-API-Key': process.env.VECTORBASE_API_KEY }
})
const { access_token } = await session.json()

// Your browser can use the short-lived token for chat requests.
await fetch('${API_URL}/api/v1/chat/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${access_token}\` },
  body: JSON.stringify({ query: 'Hello', use_rag: true, use_history: true })
})`

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet)
    setSnippetCopied(true)
    setTimeout(() => setSnippetCopied(false), 2000)
  }

  async function copyCustomCode(type: 'request' | 'conversation' | 'token', code: string) {
    await navigator.clipboard.writeText(code)
    setCustomCopied(type)
    setTimeout(() => setCustomCopied(null), 2000)
  }

  const resolvedPreviewSecret = apiKey.trim()
  const previewWidgets = previewWidgetId === 'all'
    ? WIDGET_BUILDS
    : WIDGET_BUILDS.filter((build) => build.id === previewWidgetId)

  useEffect(() => {
    if (integrationType !== 'widget') return
    // Widgets are shown in iframes below — no global script injection needed
  }, [integrationType, resolvedPreviewSecret])
  return (
    <div className="space-y-8 rounded-2xl bg-gradient-to-b from-primary/[0.035] via-transparent to-transparent p-1 sm:p-2">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Embed &amp; Deploy</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Integrations</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Choose a ready-to-embed chat widget or build a fully custom chat experience with the RAG API.
          </p>
        </div>
        <Link href="/dashboard/api-keys">
          <Button variant="outline" className="h-10 rounded-xl gap-2 text-xs font-medium shrink-0">
            <KeyRound className="size-4 text-primary" /> Manage API Keys <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </div>

      {/* Integration selector */}
      <div className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-violet-500/10 to-sky-500/10 p-1.5 shadow-sm sm:grid-cols-4" role="tablist" aria-label="Integration type">
        <button
          type="button"
          role="tab"
          aria-selected={integrationType === 'widget'}
          onClick={() => setIntegrationType('widget')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all sm:text-sm ${integrationType === 'widget' ? 'bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'}`}
        >
          <MessageSquareText className="size-4" /> Widget integration
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={integrationType === 'custom'}
          onClick={() => setIntegrationType('custom')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all sm:text-sm ${integrationType === 'custom' ? 'bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'}`}
        >
          <Braces className="size-4" /> Custom integration
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={integrationType === 'mcp'}
          onClick={() => setIntegrationType('mcp')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all sm:text-sm ${integrationType === 'mcp' ? 'bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'}`}
        >
          <Braces className="size-4" /> MCP integration
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={integrationType === 'rag'}
          onClick={() => setIntegrationType('rag')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all sm:text-sm ${integrationType === 'rag' ? 'bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'}`}
        >
          <Database className="size-4" /> RAG integration
        </button>
      </div>

      {integrationType === 'widget' ? <>
      {/* Info Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">API Key &amp; Domain Management</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              To generate new keys, lock allowed domains, configure custom system prompts, or revoke credentials, visit the API Keys page.
            </p>
          </div>
        </div>
        <Link href="/dashboard/api-keys" className="shrink-0">
          <Button className="h-9 rounded-lg text-xs gap-1.5">
            <KeyRound className="size-3.5" /> Go to API Keys
          </Button>
        </Link>
      </div>

      {/* Section 1: Code Embed Generator */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-r from-primary/[0.06] via-card to-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Code2 className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-lg">Embed Code Snippet</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Paste this script tag right before the closing <code className="rounded bg-muted px-1 py-0.5">&lt;/body&gt;</code> tag of your website.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <label htmlFor="integration-widget-select" className="sr-only">Widget</label>
            <select
              id="integration-widget-select"
              value={selectedWidgetId}
              onChange={(e) => setSelectedWidgetId(e.target.value)}
              className="h-8 max-w-44 rounded-lg border border-input bg-background px-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-ring/60"
            >
              {WIDGET_BUILDS.map((build) => (
                <option key={build.id} value={build.id}>{build.label}</option>
              ))}
            </select>
            <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">HTML</span>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="integration-api-key" className="sr-only">API Key</label>
            <input
              id="integration-api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste API key"
              className="h-8 w-44 rounded-lg border border-input bg-background px-2.5 font-mono text-[11px] outline-none focus:ring-2 focus:ring-ring/60 sm:w-56"
            />
            <Button
              onClick={copySnippet}
              variant={snippetCopied ? 'secondary' : 'default'}
              className="h-8 rounded-lg gap-1.5 px-3 text-xs font-semibold"
              aria-label={snippetCopied ? 'Snippet copied' : 'Copy embed code'}
            >
              {snippetCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {snippetCopied ? 'Copied' : 'Copy code'}
            </Button>
          </div>
        </div>

        <div className="bg-[#101827]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-2.5 text-[10px] text-slate-400 sm:px-7">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-rose-400/80" />
              <span className="size-2 rounded-full bg-amber-300/80" />
              <span className="size-2 rounded-full bg-emerald-400/80" />
              <span className="ml-2 font-mono">embed.html</span>
            </div>
            <span className="font-mono text-slate-500">HTML</span>
          </div>
          <pre className="overflow-x-auto px-0 py-5 font-mono text-[11px] leading-6 text-slate-200 sm:py-6 sm:text-xs">
            <code>
              {snippetLines.map((line, index) => (
                <span key={`${index}-${line}`} className="flex min-w-max pr-5 sm:pr-7">
                  <span className="mr-5 inline-block w-4 select-none text-right text-slate-600">{index + 1}</span>
                  <span>{line || ' '}</span>
                </span>
              ))}
            </code>
          </pre>
        </div>

        {/* Instructions */}
        <div className="border-t border-border p-5">
          <h3 className="text-sm font-semibold">Implementation Instructions</h3>
          <ol className="mt-3 list-decimal list-inside space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>Copy the script tag snippet above.</li>
            <li>Paste it into your website HTML right before the closing <code className="rounded bg-muted px-1">&lt;/body&gt;</code> tag.</li>
            <li>
              Ensure your site domain origin (e.g. <code className="rounded bg-muted px-1">{origin || 'https://your-domain.com'}</code>) is whitelisted in the key's <strong className="text-foreground">Allowed Domains</strong> on the <Link href="/dashboard/api-keys" className="text-primary underline">API Keys page</Link>.
            </li>
            <li>The chat widget bubble will automatically mount in the bottom-right corner of your site.</li>
          </ol>
        </div>
      </section>

      {/* Section 2: Live Widget Gallery */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Zap className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-lg">Live Widget Gallery</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pick a build to preview it in an isolated frame, or compare every configured build at once.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid gap-6 lg:grid-cols-[190px_minmax(0,1fr)]">
            <fieldset className="h-fit rounded-2xl border border-border bg-gradient-to-b from-primary/[0.07] via-card to-card p-3 shadow-sm">
              <legend className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Preview mode</legend>
              <div className="mt-2 space-y-1.5">
                {WIDGET_BUILDS.map((build) => (
                  <label
                    key={build.id}
                    className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-xs transition-all ${previewWidgetId === build.id ? 'border-primary/30 bg-primary/10 text-foreground shadow-sm' : 'border-transparent text-muted-foreground hover:border-border hover:bg-background hover:text-foreground'}`}
                  >
                    <input
                      type="radio"
                      name="preview-widget"
                      value={build.id}
                      checked={previewWidgetId === build.id}
                      onChange={() => setPreviewWidgetId(build.id)}
                      className="peer sr-only"
                    />
                    <span className={`grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors ${previewWidgetId === build.id ? 'border-primary bg-primary' : 'border-muted-foreground/35 group-hover:border-primary/50'}`}>
                      <span className={`size-1.5 rounded-full bg-primary-foreground transition-opacity ${previewWidgetId === build.id ? 'opacity-100' : 'opacity-0'}`} />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{build.label}</span>
                    {previewWidgetId === build.id && <Check className="size-3.5 text-primary" />}
                  </label>
                ))}
                <div className="my-2 border-t border-border/70" />
                <label className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-xs transition-all ${previewWidgetId === 'all' ? 'border-sky-500/30 bg-sky-500/10 text-foreground shadow-sm' : 'border-transparent text-muted-foreground hover:border-border hover:bg-background hover:text-foreground'}`}>
                  <input
                    type="radio"
                    name="preview-widget"
                    value="all"
                    checked={previewWidgetId === 'all'}
                    onChange={() => setPreviewWidgetId('all')}
                    className="peer sr-only"
                  />
                  <span className={`grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors ${previewWidgetId === 'all' ? 'border-sky-500 bg-sky-500' : 'border-muted-foreground/35 group-hover:border-sky-500/50'}`}>
                    <span className={`size-1.5 rounded-full bg-white transition-opacity ${previewWidgetId === 'all' ? 'opacity-100' : 'opacity-0'}`} />
                  </span>
                  <span className="min-w-0 flex-1 font-medium">Show all</span>
                  {previewWidgetId === 'all' && <Check className="size-3.5 text-sky-600" />}
                </label>
              </div>
              <p className="mt-3 px-2 text-[10px] leading-4 text-muted-foreground">{previewWidgetId === 'all' ? 'Comparing all available builds.' : 'Showing one selected build.'}</p>
            </fieldset>

            <div className="grid grid-cols-1 justify-items-center gap-6 overflow-x-auto pb-4 sm:grid-cols-2">
            {previewWidgets.map((build) => {
              const apiKey = resolvedPreviewSecret || 'YOUR_API_KEY'
              const iframeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    html { width: 100%; height: 696px; min-height: 696px; overflow: hidden; background: transparent; }
    body { width: 100%; height: 696px; min-height: 696px; margin: 0; overflow: hidden; background: transparent; }
  </style>
</head>
<body>
  <script>
    localStorage.removeItem('vb_active_convo_id');
    localStorage.removeItem('vb_chat_history');
  </script>
  <script src="${build.url}" data-api-key="${apiKey}" defer></script>
</body>
</html>`

              return (
                <div key={`${build.id}-${apiKey}`} className="w-full max-w-[520px] min-w-0">
                  <div className="h-[696px] min-h-[696px] w-full overflow-hidden rounded-xl border border-border bg-muted/20 shadow-sm">
                    <iframe
                      srcDoc={iframeHtml}
                      title={build.label}
                      className="block h-[696px] min-h-[696px] min-w-[500px] w-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                      scrolling="no"
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {build.label}
                    </span>
                  </div>
                </div>
              )
            })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground">Troubleshooting</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-foreground">403 Forbidden:</strong> Add your origin to the key&apos;s Allowed Domains.</li>
              <li><strong className="text-foreground">Widget not appearing:</strong> The script may need the correct API key — paste a valid key above.</li>
              <li><strong className="text-foreground">402 Payment Required:</strong> Token balance exhausted — top up in Profile &amp; Billing.</li>
            </ul>
          </div>
        </div>
      </section>
      </> : integrationType === 'custom' ? (
        <section className="space-y-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Braces className="size-5" /></span>
              <div>
                <h2 className="font-semibold text-lg">Build your own chat experience</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Use the chat API when you need complete control over your UI, message lifecycle, authentication, and how answers appear in your product. Your API key connects requests to this workspace’s knowledge base and settings.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
            <div className="space-y-5">
              <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">1</span><div><h2 className="font-semibold">Create and protect an API key</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Create a dedicated key for your integration. Store it in server-side environment variables or a secrets manager. For browser-based apps, use a short-lived session token instead of shipping the API key to visitors.</p></div></div>
                <div className="mt-4 flex flex-wrap gap-2 pl-11"><Link href="/dashboard/api-keys"><Button variant="outline" className="h-9 rounded-lg gap-2 text-xs"><KeyRound className="size-3.5" /> Manage API keys</Button></Link><span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800">The full key secret is shown only once when it is created.</span></div>
              </section>

              <section className="rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-start gap-3 border-b border-border p-5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">2</span><div><h2 className="font-semibold">Send a chat request</h2><p className="mt-1 text-sm text-muted-foreground">Make a <code className="rounded bg-muted px-1">POST</code> request to the chat endpoint with an API key and the user’s message.</p></div></div>
                <CodeExample label="JavaScript" code={customRequest} copied={customCopied === 'request'} onCopy={() => copyCustomCode('request', customRequest)} />
                <div className="overflow-x-auto border-t border-border"><table className="w-full text-left text-xs"><thead className="bg-muted/40 uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Field</th><th className="px-5 py-3">Required</th><th className="px-5 py-3">Purpose</th></tr></thead><tbody>{[['query', 'Yes', 'The user’s message.'], ['conversation_id', 'No', 'Pass an earlier ID to continue that thread.'], ['use_rag', 'No', 'Retrieve answers from your uploaded knowledge base (default: true).'], ['use_history', 'No', 'Include prior conversation messages (default: true).']].map(([field, required, purpose]) => <tr key={field} className="border-t border-border"><td className="px-5 py-3 font-mono text-primary">{field}</td><td className="px-5 py-3">{required}</td><td className="px-5 py-3 text-muted-foreground">{purpose}</td></tr>)}</tbody></table></div>
              </section>

              <section className="rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-start gap-3 border-b border-border p-5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">3</span><div><h2 className="font-semibold">Preserve conversation context</h2><p className="mt-1 text-sm text-muted-foreground">The response includes <code className="rounded bg-muted px-1">conversation_id</code>. Save it per chat thread and send it with the next message to retain context.</p></div></div>
                <CodeExample label="JavaScript" code={conversationRequest} copied={customCopied === 'conversation'} onCopy={() => copyCustomCode('conversation', conversationRequest)} />
              </section>

              <section className="rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-start gap-3 border-b border-border p-5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">4</span><div><h2 className="font-semibold">Use session tokens for browser apps</h2><p className="mt-1 text-sm text-muted-foreground">Keep your long-lived key on your server. Exchange it for a short-lived token, then provide that token to the browser for the chat session.</p></div></div>
                <CodeExample label="JavaScript" code={sessionTokenRequest} copied={customCopied === 'token'} onCopy={() => copyCustomCode('token', sessionTokenRequest)} />
              </section>

              <section className="rounded-xl border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">Error reference</h2><div className="mt-4 overflow-x-auto rounded-lg border border-border"><table className="w-full text-left text-xs"><thead className="bg-muted/40 uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Status</th><th className="px-4 py-3">What it means</th><th className="px-4 py-3">What to do</th></tr></thead><tbody>{[['400', 'Invalid request', 'Check the request body and ensure query is not empty.'], ['401', 'Invalid or expired credential', 'Create a new API key or session token.'], ['402', 'No available token balance', 'Add credits in Profile & Billing.'], ['403', 'Origin is not allowed', 'Add the domain to the API key’s Allowed Domains.'], ['422', 'Validation error', 'Confirm all fields use the expected types.'], ['500', 'Server error', 'Retry shortly; inspect backend logs if self-hosted.']].map(([status, meaning, action]) => <tr key={status} className="border-t border-border"><td className="px-4 py-3 font-mono font-semibold">{status}</td><td className="px-4 py-3">{meaning}</td><td className="px-4 py-3 text-muted-foreground">{action}</td></tr>)}</tbody></table></div></section>
            </div>

            <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-6"><p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">API reference</p><h2 className="mt-2 font-semibold">At a glance</h2><dl className="mt-4 space-y-4 text-xs"><div><dt className="font-medium text-foreground">Base URL</dt><dd className="mt-1 break-all font-mono text-muted-foreground">{API_URL}/api/v1</dd></div><div><dt className="font-medium text-foreground">Chat endpoint</dt><dd className="mt-1 font-mono text-muted-foreground">POST /chat/</dd></div><div><dt className="font-medium text-foreground">Authentication</dt><dd className="mt-1 text-muted-foreground"><code className="rounded bg-muted px-1">X-API-Key</code> or <code className="rounded bg-muted px-1">Bearer</code> token</dd></div><div><dt className="font-medium text-foreground">Response</dt><dd className="mt-1 text-muted-foreground"><code className="rounded bg-muted px-1">response</code> and <code className="rounded bg-muted px-1">conversation_id</code></dd></div></dl></aside>
          </div>
        </section>
      ) : (
        <section className="grid min-h-[440px] place-items-center overflow-hidden rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-10">
          <div className="max-w-md">
            <span className={`mx-auto grid size-16 place-items-center rounded-2xl ${integrationType === 'mcp' ? 'bg-violet-500/12 text-violet-600 dark:text-violet-300' : 'bg-sky-500/12 text-sky-600 dark:text-sky-300'}`}>
              {integrationType === 'mcp' ? <Braces className="size-8" /> : <Database className="size-8" />}
            </span>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <Clock3 className="size-3.5" /> Under development
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">{integrationType === 'mcp' ? 'MCP integration is on its way' : 'RAG integration is on its way'}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {integrationType === 'mcp'
                ? 'Connect your tools and data sources through the Model Context Protocol from one secure workspace.'
                : 'Bring retrieval, citations, and knowledge-grounded answers directly into your existing application flow.'}
            </p>
            <div className={`mx-auto mt-7 h-1.5 w-32 rounded-full ${integrationType === 'mcp' ? 'bg-gradient-to-r from-violet-400 to-primary' : 'bg-gradient-to-r from-sky-400 to-primary'}`} />
          </div>
        </section>
      )}
    </div>
  )
}

function CodeExample({ label, code, copied, onCopy }: { label: string; code: string; copied: boolean; onCopy: () => void }) {
  return <div className="p-5"><div className="overflow-hidden rounded-xl border border-border bg-background"><div className="flex items-center justify-between border-b border-border px-4 py-2.5"><span className="font-mono text-[11px] text-muted-foreground">{label}</span><Button onClick={onCopy} variant="outline" className="h-7 rounded-md gap-1.5 px-2.5 text-[11px]">{copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}{copied ? 'Copied' : 'Copy'}</Button></div><pre className="overflow-x-auto p-4 text-xs leading-6"><code>{code}</code></pre></div></div>
}
