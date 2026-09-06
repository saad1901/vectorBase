'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

const API_URL = ''
const WIDGET_LINK = process.env.NEXT_PUBLIC_WIDGET_LINK || 'https://vector-base.b-cdn.net/widget.js'

// ─── copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── code block ───────────────────────────────────────────────────────────────

function CodeBlock({ code, language = 'html' }: { code: string; language?: string }) {
  return (
    <div className="relative mt-3 rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6"><code>{code}</code></pre>
    </div>
  )
}

// ─── section heading ──────────────────────────────────────────────────────────

function Section({ id, step, title, children }: { id: string; step: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {step}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="mt-4 pl-11 space-y-3 text-sm leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const widgetSnippet = `<!-- VectorBase Chatbot Widget -->
<script
  src="${WIDGET_LINK}"
  data-api-key="YOUR_PUBLIC_API_KEY"
  data-api-url="${API_URL}/api/v1"
  defer>
</script>`

  const fetchExample = `await fetch('${API_URL}/api/v1/chat/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    query: 'Where is my order?',
    conversation_id: null,   // null to start a new thread
    use_rag: true,
    use_history: true
  })
})`

  const fetchResponse = `{
  "conversation_id": "conv_a1b2c3d4e5f6",
  "response": "According to your return policy, damaged items can be returned within 30 days..."
}`

  const multiTurnExample = `// First message — no conversation_id
const res1 = await fetch('${API_URL}/api/v1/chat/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-API-Key': 'YOUR_API_KEY' },
  body: JSON.stringify({ query: 'What is your return policy?', use_rag: true, use_history: true })
})
const { conversation_id, response } = await res1.json()

// Follow-up — pass the same conversation_id
const res2 = await fetch('${API_URL}/api/v1/chat/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-API-Key': 'YOUR_API_KEY' },
  body: JSON.stringify({ query: 'What about damaged items?', conversation_id, use_rag: true, use_history: true })
})`

  const sessionTokenExample = `// Exchange API key for a short-lived session token (15 min)
const res = await fetch('${API_URL}/api/v1/auth/session', {
  method: 'POST',
  headers: { 'X-API-Key': 'YOUR_API_KEY' }
})
const { access_token } = await res.json()

// Use the session token as Bearer for chat
await fetch('${API_URL}/api/v1/chat/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${access_token}\`
  },
  body: JSON.stringify({ query: 'Hello', use_rag: true, use_history: true })
})`

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Reference</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Documentation</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Everything you need to embed the chatbot widget or call the RAG API directly from your application.
        </p>
      </div>

      {/* quick links */}
      <nav className="flex flex-wrap gap-2">
        {[
          { href: '#step-1', label: '1. Generate an API key' },
          { href: '#step-2', label: '2. Embed the widget' },
          { href: '#step-3', label: '3. Call the API directly' },
          { href: '#step-4', label: '4. Multi-turn conversations' },
          { href: '#step-5', label: '5. Session tokens' },
          { href: '#step-6', label: '6. Error reference' },
        ].map((link) => (
          <a key={link.href} href={link.href}
            className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition">
            {link.label}
          </a>
        ))}
      </nav>

      <div className="space-y-10">

        {/* step 1 */}
        <Section id="step-1" step={1} title="Generate an API key">
          <p>
            Go to <strong className="text-foreground">API keys</strong> or <strong className="text-foreground">Integration</strong> in the sidebar and create a new key.
            You can optionally lock the key to specific domains (recommended for production widget deployments).
          </p>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-800">
            <strong>Important:</strong> The full key secret is shown only once at creation time. Copy and store it in a safe place — your environment variables, a secrets manager, or your deployment settings.
          </div>
          <p>
            The key is used in the <code className="rounded bg-muted px-1">X-API-Key</code> request header for all chat API calls, and in the <code className="rounded bg-muted px-1">data-api-key</code> attribute for the widget.
          </p>
        </Section>

        {/* step 2 */}
        <Section id="step-2" step={2} title="Embed the chatbot widget">
          <p>
            The widget is a single <code className="rounded bg-muted px-1">&lt;script&gt;</code> tag loaded from the CDN.
            It injects a floating chat bubble into the bottom-right corner of your page automatically.
          </p>
          <p>
            Paste the snippet just before the closing <code className="rounded bg-muted px-1">&lt;/body&gt;</code> tag.
            Replace <code className="rounded bg-muted px-1">YOUR_PUBLIC_API_KEY</code> with the key you created in Step 1.
          </p>
          <CodeBlock code={widgetSnippet} language="html" />
          <p className="mt-2 font-medium text-foreground">Widget attributes</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-2.5">Attribute</th><th className="px-4 py-2.5">Required</th><th className="px-4 py-2.5">Description</th></tr>
              </thead>
              <tbody>
                {[
                  ['data-api-key', 'Yes', 'Your public API key secret'],
                  ['data-api-url', 'Yes', `Your backend base URL — ${API_URL}/api/v1`],
                  ['data-title', 'No', 'Widget header title (default: "Support")'],
                  ['data-placeholder', 'No', 'Input placeholder text'],
                  ['data-theme', 'No', '"light" or "dark" (default: auto)'],
                ].map(([attr, req, desc]) => (
                  <tr key={attr} className="border-t border-border">
                    <td className="px-4 py-2.5 font-mono text-primary">{attr}</td>
                    <td className="px-4 py-2.5">{req}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs">
            <strong className="text-foreground">Domain locking:</strong> If your key was created with allowed domains, the widget will only work on those origins. Add your site URL (e.g. <code className="rounded bg-muted px-1">https://my-site.com</code>) when creating the key.
          </div>
        </Section>

        {/* step 3 */}
        <Section id="step-3" step={3} title="Call the chat API directly">
          <p>
            Use <code className="rounded bg-muted px-1">POST {API_URL}/api/v1/chat/</code> to send queries from your own backend or frontend without the widget.
          </p>
          <CodeBlock code={fetchExample} language="javascript" />
          <p className="mt-1 font-medium text-foreground">Response</p>
          <CodeBlock code={fetchResponse} language="json" />
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-2.5">Field</th><th className="px-4 py-2.5">Type</th><th className="px-4 py-2.5">Description</th></tr>
              </thead>
              <tbody>
                {[
                  ['query', 'string (required)', 'The user message or question'],
                  ['conversation_id', 'string | null', 'Pass null to start a new thread; pass the returned ID to continue'],
                  ['use_rag', 'boolean', 'Whether to retrieve context from your vector index (default: true)'],
                  ['use_history', 'boolean', 'Whether to include conversation history in the prompt (default: true)'],
                ].map(([field, type, desc]) => (
                  <tr key={field} className="border-t border-border">
                    <td className="px-4 py-2.5 font-mono text-primary">{field}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{type}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* step 4 */}
        <Section id="step-4" step={4} title="Multi-turn conversations">
          <p>
            To maintain context across messages, pass the <code className="rounded bg-muted px-1">conversation_id</code> returned by the first response back in every subsequent request.
            The server stores the message history and includes it in the prompt stack automatically when <code className="rounded bg-muted px-1">use_history: true</code>.
          </p>
          <CodeBlock code={multiTurnExample} language="javascript" />
          <p>
            Each <code className="rounded bg-muted px-1">conversation_id</code> is unique per thread. You can retrieve the full transcript later via <code className="rounded bg-muted px-1">GET {API_URL}/api/v1/conversations/{'{'}{'}'}id{'}'}</code>.
          </p>
        </Section>

        {/* step 5 */}
        <Section id="step-5" step={5} title="Session tokens (optional)">
          <p>
            If you need to call the chat API from a browser directly without embedding an API key in client-side code, you can exchange your API key for a short-lived session token (15 minutes) first.
            This keeps the long-lived API key server-side.
          </p>
          <CodeBlock code={sessionTokenExample} language="javascript" />
          <p>
            Session tokens use the <code className="rounded bg-muted px-1">Authorization: Bearer</code> header instead of <code className="rounded bg-muted px-1">X-API-Key</code>.
            Generate a new token server-side before each chat session and pass it to the browser.
          </p>
        </Section>

        {/* step 6 */}
        <Section id="step-6" step={6} title="Error reference">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Meaning</th><th className="px-4 py-2.5">Resolution</th></tr>
              </thead>
              <tbody>
                {[
                  ['400', 'Bad request', 'Check that query is non-empty and all required fields are present'],
                  ['401', 'Invalid or expired key/token', 'Re-generate the API key or request a new session token'],
                  ['402', 'Insufficient token balance', 'Purchase more tokens — available tokens have reached 0'],
                  ['403', 'Origin not allowed', 'Add your domain to the key\'s Allowed Domains list'],
                  ['404', 'Conversation not found', 'The conversation_id does not exist or belongs to a different tenant'],
                  ['422', 'Validation error', 'A field has the wrong type or is missing — check the request body'],
                  ['500', 'Server error', 'Retry after a moment; check your backend logs if self-hosted'],
                ].map(([code, meaning, resolution]) => (
                  <tr key={code} className="border-t border-border">
                    <td className="px-4 py-2.5 font-mono font-semibold">{code}</td>
                    <td className="px-4 py-2.5 text-foreground">{meaning}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{resolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* api base url note */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-semibold">API base URL</p>
          <code className="mt-2 block rounded-md border border-border bg-background px-4 py-3 text-sm">{API_URL}/api/v1</code>
          <p className="mt-2 text-xs text-muted-foreground">
            Requests use this app’s same-origin <code className="rounded bg-muted px-1">/api/v1</code> proxy. Configure the backend URL only on the Next.js server.
          </p>
        </div>

      </div>
    </div>
  )
}
