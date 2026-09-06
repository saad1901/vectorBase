import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Same-origin gateway for FastAPI.
 * - Reads FASTAPI_BACKEND_URL and FASTAPI_ADMIN_SECRET at request time so
 *   .env.local changes take effect without a full rebuild.
 * - Injects X-Admin-Secret server-side; the browser never sees the credential.
 * - Only forwards a safe header allowlist from the client.
 */
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  // Read at request time — avoids stale module-level constants during dev
  const backendUrl = (process.env.FASTAPI_BACKEND_URL ?? '').replace(/\/$/, '')
  const adminSecret = process.env.FASTAPI_ADMIN_SECRET ?? ''

  if (!backendUrl || !adminSecret) {
    return Response.json({ detail: 'Server proxy is not configured.' }, { status: 500 })
  }

  const { path } = await context.params

  // Only proxy the /api/v1/* namespace
  if (path[0] !== 'v1') {
    return Response.json({ detail: 'Not found.' }, { status: 404 })
  }

  const upstream = new URL(`${backendUrl}/api/${path.join('/')}`)
  upstream.search = request.nextUrl.search

  // Build upstream headers — allowlist only, then inject the admin credential
  const headers = new Headers()
  const allowlist = [
    'accept',
    'authorization',
    'content-type',
    'x-api-key',
    'idempotency-key',
    // Required for API key domain validation — FastAPI checks allowed_domains
    // against the Origin (or Referer) of the incoming request.
    'origin',
    'referer',
  ]
  for (const name of allowlist) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  // Injected server-side — never comes from the browser
  headers.set('X-Admin-Secret', adminSecret)

  try {
    const hasBody = !['GET', 'HEAD'].includes(request.method)
    const body = hasBody ? await request.arrayBuffer() : undefined

    const response = await fetch(upstream, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    })

    const responseHeaders = new Headers()
    const contentType = response.headers.get('content-type')
    if (contentType) responseHeaders.set('content-type', contentType)

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch {
    return Response.json({ detail: 'Could not reach the FastAPI backend.' }, { status: 502 })
  }
}

export const GET     = proxy
export const POST    = proxy
export const PUT     = proxy
export const PATCH   = proxy
export const DELETE  = proxy
export const OPTIONS = proxy
