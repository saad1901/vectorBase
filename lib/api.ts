// The browser only ever talks to the same-origin Next.js proxy. Backend URLs
// and admin credentials are intentionally unavailable to client bundles.
const API_URL = ''

export class ApiError extends Error {
  status: number
  details: unknown
  constructor(message: string, status: number, details?: unknown) { super(message); this.name = 'ApiError'; this.status = status; this.details = details }
}

async function request<T>(path: string, options: RequestInit = {}, auth: 'tenant' | 'admin' | 'none' = 'tenant'): Promise<T> {
  const headers = new Headers(options.headers)
  const url = `${API_URL}${path}`
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  // Tenant JWTs are safe to forward to the same-origin proxy. Do not attach a
  // tenant token to public chat/auth requests.
  if (auth === 'tenant' && typeof window !== 'undefined') {
    const token = getSessionToken()
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  let response: Response
  try { response = await fetch(url, { ...options, headers }) } catch { throw new ApiError(`Could not connect to the server proxy at ${path}.`, 0) }
  const raw = await response.text()
  let data: unknown = raw
  try { data = raw ? JSON.parse(raw) : undefined } catch { /* plain text */ }
  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'detail' in data ? String((data as { detail: unknown }).detail) : raw || 'Request failed.'
    if (auth === 'tenant' && typeof window !== 'undefined' && (response.status === 401 || response.status === 403 || message.toLowerCase().includes('expired'))) {
      clearTenantSession()
      window.location.assign('/login?expired=1')
    }
    throw new ApiError(message, response.status, data)
  }
  return data as T
}

export const api = {
  tenantGet: <T>(path: string) => request<T>(path),
  tenantPost: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  tenantDashboard: () => request<TenantDashboardResponse>('/api/v1/tenant/dashboard'),
  tenantApiKeys: () => request<TenantApiKeySummary[]>('/api/v1/tenant/dashboard/apikeys'),
  // Document job endpoints
  uploadDocument: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    // Pass FormData as body — request() must not set Content-Type so the browser
    // sets it automatically with the correct multipart boundary.
    return request<EmbedResponse>('/api/v1/job/upload', { method: 'POST', body: form })
  },
  getDocumentJob: (jobId: string) => request<DocumentJobResponse>(`/api/v1/job/${jobId}`),
  deleteDocumentJob: async (jobId: string) => {
    const res = await request<{ status?: string; message?: string } | undefined>(`/api/v1/job/${jobId}`, { method: 'DELETE' })
    return res || { status: 'success', message: 'Document deleted successfully' }
  },
  listDocumentJobs: (params?: { status?: JobStatus; skip?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.skip !== undefined) query.set('skip', String(params.skip))
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    const qs = query.toString()
    return request<DocumentJobListResponse>(`/api/v1/job/all${qs ? `?${qs}` : ''}`)
  },
  // Chat endpoint — authenticated with client API key, not JWT
  chatQuery: (apiKey: string, body: ChatQueryRequest) =>
    request<ChatQueryResponse>('/api/v1/chat', {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: JSON.stringify({
        query: body.query,
        ...(body.conversation_id ? { conversation_id: body.conversation_id } : {}),
        use_rag: body.use_rag ?? true,
        use_history: body.use_history ?? true,
      }),
    }, 'none'),
  // Conversation endpoints — authenticated with tenant JWT
  listConversations: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.limit !== undefined) q.set('limit', String(params.limit))
    if (params?.offset !== undefined) q.set('offset', String(params.offset))
    const qs = q.toString()
    return request<ConversationSummary[]>(`/api/v1/conversations${qs ? `?${qs}` : ''}`)
  },
  getConversation: (id: string) => request<ConversationDetail>(`/api/v1/conversations/${id}`),
  renameConversation: (id: string, title: string) =>
    request<ConversationSummary>(`/api/v1/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    }),
  deleteConversation: (id: string) =>
    request<void>(`/api/v1/conversations/${id}`, { method: 'DELETE' }),
  tenantUsage: (filters: TenantUsageFilters) => {
    const params = new URLSearchParams()
    if (filters.apiKeyId !== 'all') params.set('api_key_id', filters.apiKeyId)
    if (filters.duration !== 'all') params.set('duration', filters.duration)
    const query = params.toString()
    return request<TenantUsageResponse>(`/api/v1/tenant/dashboard/usage${query ? `?${query}` : ''}`)
  },
  tenantCreateApiKey: (
    name: string,
    allowedDomains?: string[],
    systemPrompt?: string,
    generationParams?: GenerationParams,
  ) => {
    const cleanDomains = allowedDomains?.filter((d) => d.trim() !== '*')
    // Schema: TenantCreateAPIKeyRequest — required field is `key_name`
    return request<TenantCreateApiKeyResponse>('/api/v1/tenant/createapi', {
      method: 'POST',
      body: JSON.stringify({
        key_name: name,
        ...(cleanDomains?.length ? { allowed_domains: cleanDomains } : {}),
        ...(systemPrompt?.trim() ? { system_prompt: systemPrompt.trim() } : {}),
        ...(generationParams ? { generation_params: generationParams } : {}),
      }),
    })
  },
  tenantRevokeApiKey: (id: number) =>
    request<{ status: string; message: string }>(`/api/v1/tenant/apikey/${id}/revoke`, {
      method: 'POST',
    }),
  tenantUpdateApiKey: (
    id: number,
    body: {
      key_name?: string
      allowed_domains?: string[]
      system_prompt?: string
      generation_params?: GenerationParams
    },
  ) =>
    request<TenantApiKeySummary>(`/api/v1/tenant/apikey/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  adminPost: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }, 'admin'),
  adminGet: <T>(path: string) => request<T>(path, {}, 'admin'),
  adminPatch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, 'admin'),
  adminDelete: <T>(path: string) => request<T>(path, { method: 'DELETE' }, 'admin'),
  noneGet: <T>(path: string) => request<T>(path, {}, 'none'),
  nonePost: <T>(
    path: string,
    body: unknown,
    options: RequestInit = {}
  ) =>
    request<T>(
      path,
      {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
      },
      'none'
    ),
}

export function saveTenantKey(key: string) { if (typeof window !== 'undefined') window.localStorage.setItem('tenant_api_key', key) }
export function getTenantKey() { return typeof window !== 'undefined' ? window.localStorage.getItem('tenant_api_key') || '' : '' }
export function clearTenantKey() { if (typeof window !== 'undefined') window.localStorage.removeItem('tenant_api_key') }

export function saveSessionToken(token: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem('tenant_session_token', token)
}

/** Returns true only for JWTs with an expired `exp` claim. Opaque tokens are
 * checked by the API and cleared when the server returns an auth error. */
export function isSessionTokenExpired(token: string) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return false
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=')
    const decoded = JSON.parse(atob(normalized)) as { exp?: unknown }
    return typeof decoded.exp === 'number' && decoded.exp * 1000 <= Date.now()
  } catch {
    return false
  }
}

export function getSessionToken() {
  if (typeof window === 'undefined') return ''
  const token = window.localStorage.getItem('tenant_session_token') || ''
  if (token && isSessionTokenExpired(token)) {
    clearTenantSession()
    return ''
  }
  return token
}

export function clearSessionToken() {
  if (typeof window !== 'undefined') window.localStorage.removeItem('tenant_session_token')
}

export function clearTenantSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('tenant_session_token')
    window.localStorage.removeItem('tenant_profile')
    window.localStorage.removeItem('tenant_dashboard')
    window.dispatchEvent(new CustomEvent('tenant-session-cleared'))
  }
}

export function extractSessionToken(data: unknown) {
  if (typeof data === 'string') return data
  if (!data || typeof data !== 'object') return ''
  const session = data as Record<string, unknown>
  return String(session.access_token || session.token || session.session_token || session.jwt || '')
}

export type TenantProfile = { fullName: string; email: string; companyName: string; phone?: string }

export type TenantDashboardProfile = {
  id: number
  full_name: string
  email: string
  company_name: string
  phone?: string | null
  is_active: boolean
  created_at: string
}

export type TenantDashboardStats = {
  available_tokens: number
  total_tokens_purchased: number
  total_tokens_used: number
  usage_percentage: number
}

export type RagStrictness = 'no_rag' | 'strict' | 'hybrid' | 'flexible'
export type ResponseLength = 'concise' | 'medium' | 'detailed' | 'bullet_points'

export interface GenerationParams {
  temperature: number
  top_p: number
  max_output_tokens: number
  rag_strictness: RagStrictness
  response_length: ResponseLength
}

export interface CreateApiKeyFormState {
  key_name: string
  allowed_domains: string[]
  system_prompt: string
  generation_params: GenerationParams
}

export const defaultGenerationParams: GenerationParams = {
  temperature: 0.0,
  top_p: 0.95,
  max_output_tokens: 800,
  rag_strictness: 'strict',
  response_length: 'medium',
}

export const initialCreateApiKeyFormState: CreateApiKeyFormState = {
  key_name: '',
  allowed_domains: [],
  system_prompt: '',
  generation_params: { ...defaultGenerationParams },
}

export type TenantApiKeySummary = {
  id: number
  key_name?: string | null
  prefix: string
  is_active: boolean
  created_at: string
  last_used_at?: string | null
  allowed_domains?: string[] | null
  system_prompt?: string | null
  generation_params?: GenerationParams | null
}

export type TenantUsageFilters = {
  apiKeyId: string
  duration: '7d' | '30d' | '90d' | 'all'
}

export type TenantUsageRow = {
  id?: number
  conversation_id?: string | null
  conversation?: string | null
  api_key_id?: number | string | null
  api_key_name?: string | null
  key_name?: string | null
  api_key_prefix?: string | null
  prefix?: string | null
  prompt_tokens?: number | string | null
  completion_tokens?: number | string | null
  total_tokens?: number | string | null
  created_at?: string | null
  timestamp?: string | null
}

export type TenantUsageResponse = TenantUsageRow[] | {
  usage?: TenantUsageRow[]
  rows?: TenantUsageRow[]
  items?: TenantUsageRow[]
  results?: TenantUsageRow[]
}

export type TenantCreateApiKeyResponse = {
  id?: number
  api_key?: string
  key?: string
  token?: string
  secret?: string
  key_name?: string
  allowed_domains?: string[]
}

export type WidgetApiKeySummary = {
  id: number
  key_name: string
  allowed_domains: string[]
  is_active: boolean
  created_at: string
  prefix?: string
  last_used_at?: string | null
}

export type TokenBillingSummary = {
  id: number
  tokens_added: number
  amount_paid: number
  currency?: string
  created_at: string
  status: string
}

export type TenantDashboardResponse = {
  profile: TenantDashboardProfile
  token_stats: TenantDashboardStats
  recent_api_keys?: TenantApiKeySummary[]
  recent_billings?: TokenBillingSummary[]
}

export function tenantProfileFromDashboard(profile: TenantDashboardProfile): TenantProfile {
  return {
    fullName: profile.full_name,
    email: profile.email,
    companyName: profile.company_name,
    phone: profile.phone || undefined,
  }
}

export function saveTenantProfile(profile: TenantProfile) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('tenant_profile', JSON.stringify(profile))
    window.dispatchEvent(new CustomEvent('tenant-profile-updated'))
  }
}

export function getTenantProfile(): TenantProfile | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem('tenant_profile')
  if (!raw) return null
  try { return JSON.parse(raw) as TenantProfile } catch { return null }
}

export function saveTenantDashboard(dashboard: TenantDashboardResponse) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('tenant_dashboard', JSON.stringify(dashboard))
    window.dispatchEvent(new CustomEvent('tenant-dashboard-updated'))
  }
}

export function getTenantDashboard(): TenantDashboardResponse | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem('tenant_dashboard')
  if (!raw) return null
  try { return JSON.parse(raw) as TenantDashboardResponse } catch { return null }
}

export function isExpiredSessionError(error: unknown) {
  if (!(error instanceof ApiError)) return false
  const message = error.message.toLowerCase()
  return error.status === 401 || error.status === 403 || message.includes('expired') || message.includes('invalid token') || message.includes('not authenticated')
}

// ─── Document job types ────────────────────────────────────────────────────

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

export type EmbedResponse = {
  status: string   // "queued"
  job_id: string
  tenant_id: string
}

export type DocumentJobResponse = {
  doc_id: string
  job_id: string
  filename: string
  file_key: string
  status: JobStatus
  error_message?: string | null
  created_at: string
  updated_at: string
}

export type DocumentJobListResponse = {
  tenant_id: string
  total: number
  page_size: number
  skip: number
  items: DocumentJobResponse[]
}

// ─── Chat types ────────────────────────────────────────────────────────────

export type ChatQueryRequest = {
  query: string
  conversation_id?: string | null
  use_rag?: boolean
  use_history?: boolean
}

export type ChatQueryResponse = {
  conversation_id: string
  response: string
}

// ─── Conversation types ────────────────────────────────────────────────────

export type ConversationSummary = {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export type ConversationMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  tokens_used?: number
  created_at: string
}

export type ConversationDetail = ConversationSummary & {
  messages: ConversationMessage[]
}
