'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, FileWarning, Loader2, RefreshCw, ScrollText } from 'lucide-react'
import { ApiError, api, clearTenantSession, isExpiredSessionError, TenantApiLog, TenantApiLogResponse } from '@/lib/api'

const HTTP_STATUS_CODES = [
  [100, 'Continue'], [101, 'Switching Protocols'], [102, 'Processing'], [103, 'Early Hints'],
  [200, 'OK'], [201, 'Created'], [202, 'Accepted'], [203, 'Non-Authoritative Information'], [204, 'No Content'], [205, 'Reset Content'], [206, 'Partial Content'], [207, 'Multi-Status'], [208, 'Already Reported'], [226, 'IM Used'],
  [300, 'Multiple Choices'], [301, 'Moved Permanently'], [302, 'Found'], [303, 'See Other'], [304, 'Not Modified'], [307, 'Temporary Redirect'], [308, 'Permanent Redirect'],
  [400, 'Bad Request'], [401, 'Unauthorized'], [402, 'Payment Required'], [403, 'Forbidden'], [404, 'Not Found'], [405, 'Method Not Allowed'], [406, 'Not Acceptable'], [407, 'Proxy Authentication Required'], [408, 'Request Timeout'], [409, 'Conflict'], [410, 'Gone'], [411, 'Length Required'], [412, 'Precondition Failed'], [413, 'Content Too Large'], [414, 'URI Too Long'], [415, 'Unsupported Media Type'], [416, 'Range Not Satisfiable'], [417, 'Expectation Failed'], [418, "I'm a teapot"], [421, 'Misdirected Request'], [422, 'Unprocessable Content'], [423, 'Locked'], [424, 'Failed Dependency'], [425, 'Too Early'], [426, 'Upgrade Required'], [428, 'Precondition Required'], [429, 'Too Many Requests'], [431, 'Request Header Fields Too Large'], [451, 'Unavailable For Legal Reasons'],
  [500, 'Internal Server Error'], [501, 'Not Implemented'], [502, 'Bad Gateway'], [503, 'Service Unavailable'], [504, 'Gateway Timeout'], [505, 'HTTP Version Not Supported'], [506, 'Variant Also Negotiates'], [507, 'Insufficient Storage'], [508, 'Loop Detected'], [510, 'Not Extended'], [511, 'Network Authentication Required'],
] as const

function getLogs(response: TenantApiLogResponse): TenantApiLog[] {
  if (Array.isArray(response)) return response
  return response.logs || response.items || response.results || []
}

function getTotal(response: TenantApiLogResponse, fallback: number) {
  return Array.isArray(response) ? fallback : response.total ?? fallback
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function statusClass(statusCode: number | string | null | undefined) {
  const code = Number(statusCode)
  if (code >= 500) return 'bg-rose-500/10 text-rose-700'
  if (code >= 400) return 'bg-amber-500/10 text-amber-800'
  if (code >= 300) return 'bg-sky-500/10 text-sky-700'
  if (code >= 200) return 'bg-emerald-500/10 text-emerald-700'
  return 'bg-muted text-muted-foreground'
}

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<TenantApiLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [statusCode, setStatusCode] = useState('')
  const [keyId, setKeyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.tenantApiLogs({
        page,
        limit,
        ...(statusCode ? { statusCode: Number(statusCode) } : {}),
        ...(keyId ? { keyId: Number(keyId) } : {}),
      })
      const nextLogs = getLogs(response)
      setLogs(nextLogs)
      setTotal(getTotal(response, nextLogs.length))
    } catch (err) {
      if (isExpiredSessionError(err)) {
        clearTenantSession()
        window.location.assign('/login?expired=1')
        return
      }
      setError(err instanceof ApiError ? err.message : 'Could not load API logs.')
    } finally {
      setLoading(false)
    }
  }, [keyId, limit, page, statusCode])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Workspace activity</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">API logs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review failed API requests, including token, server, and revoked-key errors.
          </p>
        </div>
        <button
          type="button"
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-xl border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 sm:self-auto"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />{error}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <label className="text-xs font-medium text-muted-foreground">
          Status code
          <select
            value={statusCode}
            onChange={(event) => { setStatusCode(event.target.value); setPage(1) }}
            className="mt-1 block h-9 w-56 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/60"
          >
            <option value="">All status codes</option>
            {HTTP_STATUS_CODES.map(([code, label]) => (
              <option key={code} value={code}>{code} {label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          API key ID
          <input
            type="number"
            min="1"
            value={keyId}
            onChange={(event) => { setKeyId(event.target.value); setPage(1) }}
            placeholder="All"
            className="mt-1 block h-9 w-28 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/60"
          />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Per page
          <select
            value={limit}
            onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }}
            className="mt-1 block h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/60"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <ScrollText className="size-4" />
          </span>
          <div>
            <h2 className="font-semibold">Failed API requests</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{total} log{total !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-14 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 size-5 animate-spin text-primary" />
            Loading API logs…
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-muted-foreground">
            <FileWarning className="mx-auto mb-2 size-6" />
            No API failure logs yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Key name</th>
                  <th className="px-5 py-3">Status code</th>
                  <th className="px-5 py-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  const message = log.error_message || log.msg || log.message || '—'
                  return (
                    <tr key={String(log.id ?? `${log.timestamp}-${index}`)} className="border-t border-border hover:bg-muted/30">
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</td>
                      <td className="px-5 py-4 font-medium">{log.key_name || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(log.status_code)}`}>
                          {log.status_code ?? '—'}
                        </span>
                      </td>
                      <td className="max-w-[520px] px-5 py-4 text-sm text-muted-foreground">{message}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <span className="text-xs text-muted-foreground">Page {page} of {Math.max(1, Math.ceil(total / limit))}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= Math.ceil(total / limit)}
                aria-label="Next page"
                className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
