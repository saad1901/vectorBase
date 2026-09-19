<div align="center">

<br/>

# ⚡ VectorBase

### The Multi-Tenant RAG Control Plane for AI-Powered Support Chatbots

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)](./LICENSE)

<br/>

<a href="https://vectorbase.vercel.app" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/🚀_Live_Demo-vectorbase.vercel.app-22c55e?style=for-the-badge" alt="Live Demo" /></a>
<a href="https://lnkd.in/p/dvC3myRs" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/LinkedIn-Post-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>

<br/>

> **Upload your docs. Configure your AI. Embed your chatbot. Done.**
>
> VectorBase gives SaaS teams a production-ready RAG dashboard — tenant-isolated workspaces, document ingestion pipelines, a live chat playground, embeddable widgets, and an admin control plane, all in one place.

<br/>

---

</div>

<br/>

## 📸 What's Inside

```
🏠  Dashboard Overview    →  Token usage, quick-launch cards, billing history
📄  Documents             →  Upload PDFs & TXT, drag-and-drop, live job polling
🔑  API Keys              →  Generate keys, set allowed domains, tune system prompts
🤖  Chat Playground       →  RAG strictness, temperature, history — tweak & test live
🔌  Integration           →  Copy embed snippet, preview widget, AI editor prompts
💬  Conversations         →  Full chat history browser with transcript viewer
💳  Pricing / Billing     →  Razorpay-powered token plans with one-click checkout
👤  Profile               →  Workspace settings and account management
🛡️  Admin Panel           →  Tenant management, usage analytics, payment oversight
```

<br/>

---

## ✨ Key Features

### 🧠 Retrieval-Augmented Generation Engine
- Plug your own documents into the knowledge base and power a grounded AI assistant
- Four RAG strictness modes: **Strict**, **Hybrid**, **Flexible**, and **No RAG**
- Per-key system prompt overrides and generation parameter control (temperature, top-p, response length)
- Conversation history tracking with multi-turn context

### 📦 Document Ingestion Pipeline
- Upload **PDF** and **TXT** files via drag-and-drop or paste raw text directly
- Background processing: extract → chunk → embed → vector index
- Real-time job status polling (`queued → processing → completed`)
- Bulk upload with per-file retry on failure

### 🔐 Multi-Tenant Isolation
- Every workspace is fully isolated — documents, API keys, conversations, tokens, and billing
- JWT-based tenant session auth with automatic expiry handling
- CORS-locked API keys with per-origin allowlists
- Admin secret injected server-side via Next.js API route proxy

### 🧩 Embeddable Widget
- Drop a single `<script>` tag on any website and your AI chatbot is live
- Widget communicates over `POST /api/v1/chat` using `X-API-Key`
- Supports `conversation_id` threading for multi-turn chat continuity

### 🛡️ Admin Control Plane
- Full tenant CRUD: create, suspend, restore, credit tokens
- Usage analytics by period, tenant, and API key
- Payment management with retry and audit trail
- Emergency widget kill-switch with audit logging
- System health dashboard (API, DB, queue, vector store, CDN)

### 💳 Token-Based Billing (Razorpay)
| Plan | Tokens | Price |
|---|---|---|
| Starter | 10M | ₹249 |
| Growth | 25M | ₹449 |
| Scale | 50M | ₹799 |
| Add-on | 1M | ₹29/unit |

Server-side order creation, signature verification, and webhook reconciliation — tokens only credit after verified payment.

<br/>

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5.7 |
| **Styling** | Tailwind CSS v4, tw-animate-css |
| **UI Primitives** | Base UI, shadcn/ui, Lucide React |
| **Markdown** | react-markdown + remark-gfm |
| **Analytics** | Vercel Analytics |
| **Payments** | Razorpay Checkout |
| **Backend** | FastAPI (external, proxied via Next.js API routes) |

<br/>

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>=20`
- A running instance of the VectorBase FastAPI backend

### 1. Clone the repo

```bash
git clone https://github.com/your-username/vectorbase-dashboard.git
cd vectorbase-dashboard
```

### 2. Install dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# URL of your FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Admin secret — injected server-side, never exposed to the browser
NEXT_PUBLIC_ADMIN_SECRET=your_admin_secret_here

# Widget CDN script URL
NEXT_PUBLIC_WIDGET_LINK=https://saad1901.github.io/vbase/widget.js

# Optional: default public widget key for Integration page preview
NEXT_PUBLIC_PUBLIC_KEY=
```

> ⚠️ **Security note:** Despite the `NEXT_PUBLIC_` prefix on `ADMIN_SECRET`, this value is only used inside Next.js API route handlers (server-side). Never expose real admin credentials in client-side JavaScript.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

<br/>

---

## 📁 Project Structure

```
📦 vectorbase-dashboard
├── app/
│   ├── admin/               # Admin panel (tenants, usage, payments, widgets)
│   ├── api/[...path]/       # Proxy route — forwards requests to FastAPI backend
│   ├── dashboard/           # Tenant workspace (docs, keys, playground, etc.)
│   ├── login/               # Auth pages
│   ├── register/
│   ├── playground/          # Public playground page
│   └── widget/              # Widget preview page
├── components/
│   ├── admin-shell.tsx      # Admin sidebar + layout
│   ├── dashboard-shell.tsx  # Tenant dashboard sidebar + layout
│   └── ui/                  # Shared UI primitives (Button, MarkdownRenderer)
├── lib/
│   ├── api.ts               # Full typed API client for all endpoints
│   └── utils.ts             # Utility helpers
└── public/                  # Static assets
```

<br/>

---

## 🔌 Widget Integration

Embed the AI chatbot on any website in 30 seconds:

```html
<script
  src="https://saad1901.github.io/vbase/widget.js"
  data-api-key="YOUR_PUBLIC_API_KEY"
  defer>
</script>
```

The widget automatically handles:
- Chat UI rendering
- `POST /api/v1/chat` communication
- Conversation threading via `conversation_id`
- CORS validation against your key's allowed domains

<br/>

---

## 🛠️ API Quick Reference

The dashboard proxies all requests through `/app/api/[...path]/route.ts` to the FastAPI backend. Core endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/chat` | Send a chat query (X-API-Key auth) |
| `POST` | `/api/v1/auth/login` | Tenant login → JWT |
| `GET` | `/api/v1/tenant/dashboard` | Workspace overview + stats |
| `POST` | `/api/v1/job/upload` | Upload document for ingestion |
| `GET` | `/api/v1/job/all` | List document processing jobs |
| `GET` | `/api/v1/conversations` | Conversation history |
| `GET` | `/api/v1/tenant/dashboard/apikeys` | List API keys |

See [`apiserver-endpoints.md`](./apiserver-endpoints.md) for the full OpenAPI spec and [`ADMIN_API_CONTRACT.md`](./ADMIN_API_CONTRACT.md) for the admin API contract.

<br/>

---

## 🧪 Playground Guide

The built-in RAG Chat Playground lets you test your knowledge base before deploying.

1. **Generate a key** — click *Generate Key* to auto-create a scoped API key
2. **Adjust parameters** — tune RAG strictness, response length, and temperature
3. **Toggle RAG / History** — compare grounded vs. direct model responses
4. **Send queries** — fire test questions and inspect the model's citations
5. **Reset session** — clear history and start a fresh conversation thread

<br/>

---

## 🤝 AI Editor Integration

The Integration page generates ready-to-paste prompts for popular AI coding tools:

| Tool | Prompt Format |
|---|---|
| ![Cursor](./logos/cursorr.png) Cursor | Context-aware API integration instructions |
| ![Kiro](./logos/kiro.png) Kiro | Steering file with full API spec |
| ![VS Code + Copilot](./logos/vscode.png) GitHub Copilot | Inline comment prompts |
| ![Lovable](./logos/lovable.png) Lovable | Natural language component generation prompts |
| ![AntiGravity](./logos/antigravity.png) AntiGravity | Custom agent instructions |

<br/>

---

## 🏭 Building for Production

```bash
npm run build
npm run start
```

Or deploy instantly to [Vercel](https://vercel.com) — the project is fully compatible with the Vercel edge runtime.

<br/>

---

## 🔒 Security Considerations

- Admin secrets are **never** sent to the browser — they're injected server-side in API route handlers
- API keys support **CORS domain allowlists** to restrict widget usage to specific origins
- All tenant data queries are **scoped by tenant ID** — cross-tenant data access is not possible
- Razorpay payment signatures are **verified server-side** before any token credit is applied
- Webhook events are **idempotent** — duplicate events cannot double-credit tokens

<br/>

---

## 📄 License

This project is private. All rights reserved.

<br/>

---

<div align="center">

Built with ❤️ using **Next.js**, **TypeScript**, and **Tailwind CSS**

</div>
