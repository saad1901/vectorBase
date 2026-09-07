'use client'

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  PenLine,
  RefreshCw,
  Search,
  ServerCrash,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react'
import { ApiError, api, isExpiredSessionError, clearTenantSession, DocumentJobResponse, JobStatus } from '@/lib/api'

// ─── types ────────────────────────────────────────────────────────────────────

type StagedFile = {
  /** browser File object — present until upload completes */
  file: File
  /** set once the server responds with a job_id */
  jobId: string | null
  /** local optimistic status before first poll */
  localStatus: 'pending' | 'uploading' | 'done' | 'error'
  error: string | null
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

const STATUS_META: Record<JobStatus, { label: string; className: string }> = {
  queued:     { label: 'Queued',     className: 'bg-amber-500/10 text-amber-800' },
  processing: { label: 'Processing', className: 'bg-sky-500/10 text-sky-700' },
  completed:  { label: 'Completed',  className: 'bg-emerald-500/10 text-emerald-700' },
  failed:     { label: 'Failed',     className: 'bg-destructive/10 text-destructive' },
}

function StatusBadge({ status }: { status: JobStatus }) {
  const meta = STATUS_META[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  )
}

// ─── polling interval (ms) ────────────────────────────────────────────────────
const POLL_INTERVAL = 4000

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  // staged files waiting to be uploaded or currently uploading
  const [staged, setStaged] = useState<StagedFile[]>([])
  // jobs fetched from the server
  const [jobs, setJobs] = useState<DocumentJobResponse[]>([])
  const [jobsTotal, setJobsTotal] = useState(0)
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobsError, setJobsError] = useState('')
  // global upload error banner
  const [uploadError, setUploadError] = useState('')
  // drag-over state
  const [dragging, setDragging] = useState(false)
  const [inputMode, setInputMode] = useState<'upload' | 'write'>('upload')
  const [textTitle, setTextTitle] = useState('')
  const [textDraft, setTextDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  // track which job ids are still active so we know when to keep polling
  const activeJobIds = useRef<Set<string>>(new Set())

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Deletion modal state
  const [deletingJob, setDeletingJob] = useState<DocumentJobResponse | null>(null)
  const [deletingJobIds, setDeletingJobIds] = useState<Set<string>>(new Set())

  // Toast notification
  const [toast, setToast] = useState<{ id?: string; msg: string; type: 'success' | 'error' | 'loading' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' | 'loading' = 'success', duration = 4000) {
    setToast({ id: Date.now().toString(), msg, type })
    if (type !== 'loading') {
      setTimeout(() => {
        setToast((current) => (current?.msg === msg ? null : current))
      }, duration)
    }
  }

  // ── redirect helper ──────────────────────────────────────────────────────
  function redirectToLogin(expired = false) {
    clearTenantSession()
    window.location.assign(expired ? '/login?expired=1' : '/login')
  }

  // ── load job list ────────────────────────────────────────────────────────
  const loadJobs = useCallback(async (silent = false) => {
    if (!silent) setJobsLoading(true)
    setJobsError('')
    try {
      const res = await api.listDocumentJobs({ limit: 100 })
      setJobs(res.items)
      setJobsTotal(res.total)
      // track which jobs are still in-flight
      activeJobIds.current = new Set(
        res.items
          .filter((j) => j.status === 'queued' || j.status === 'processing')
          .map((j) => j.job_id),
      )
    } catch (err) {
      if (isExpiredSessionError(err)) { redirectToLogin(true); return }
      setJobsError(err instanceof ApiError ? err.message : 'Could not load document jobs.')
    } finally {
      if (!silent) setJobsLoading(false)
    }
  }, [])

  // ── initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  // ── polling: refresh while any job is queued / processing ────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (activeJobIds.current.size > 0) {
        loadJobs(true)
      }
    }, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [loadJobs])

  // ── also poll when staged list has uploading items ────────────────────────
  useEffect(() => {
    const hasUploading = staged.some((s) => s.localStatus === 'uploading')
    if (!hasUploading) return
    const id = setInterval(() => loadJobs(true), POLL_INTERVAL)
    return () => clearInterval(id)
  }, [staged, loadJobs])

  // ── handle document deletion ──────────────────────────────────────────────
  async function confirmDeleteJob() {
    if (!deletingJob) return
    const targetJob = deletingJob
    const targetId = targetJob.job_id
    const targetFilename = targetJob.filename

    // Close modal immediately to keep UI crisp and un-stuck
    setDeletingJob(null)

    // Mark job ID as currently deleting in state
    setDeletingJobIds((prev) => new Set(prev).add(targetId))

    // Show top-right loading toast
    showToast(`Deleting "${targetFilename}" and embeddings…`, 'loading')

    try {
      // Execute backend delete API (returns 204 or 200)
      await api.deleteDocumentJob(targetId)

      // Optimistically remove from jobs state upon completion
      setJobs((prev) => prev.filter((j) => j.job_id !== targetId))
      setJobsTotal((prev) => Math.max(0, prev - 1))
      activeJobIds.current.delete(targetId)

      // Show clear success toast on top-right
      showToast(`Document "${targetFilename}" deleted successfully.`, 'success', 4500)
    } catch (err) {
      if (isExpiredSessionError(err)) { redirectToLogin(true); return }
      const errorMsg = err instanceof ApiError ? err.message : 'Could not delete document.'
      showToast(`Failed to delete "${targetFilename}": ${errorMsg}`, 'error', 5000)
    } finally {
      setDeletingJobIds((prev) => {
        const next = new Set(prev)
        next.delete(targetId)
        return next
      })
    }
  }

  // ── handle file selection ─────────────────────────────────────────────────
  function addFiles(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) return
    setUploadError('')
    const supportedFiles = Array.from(fileList).filter((file) => {
      const filename = file.name.toLowerCase()
      return filename.endsWith('.pdf') || filename.endsWith('.txt')
    })

    if (supportedFiles.length === 0) {
      setUploadError('Only PDF and TXT files can be added to the ingestion queue.')
      return
    }

    if (supportedFiles.length < fileList.length) {
      setUploadError('Some files were skipped. Only PDF and TXT files can be added.')
    }

    const next: StagedFile[] = supportedFiles.map((file) => ({
      file,
      jobId: null,
      localStatus: 'pending',
      error: null,
    }))
    setStaged((prev) => [...prev, ...next])
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files)
    // reset so the same file can be picked again
    event.target.value = ''
  }

  function stageText() {
    const text = textDraft.trim()
    if (!text) {
      setUploadError('Enter some text before adding it to the upload queue.')
      return
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const titleBase = textTitle.trim().replace(/ /g, '').replace(/[\\/:*?"<>|]/g, '-').replace(/\.[^.]+$/, '').trim()
    const filename = `${titleBase || `text-${timestamp}`}.txt`
    const textFile = new File([text], filename, { type: 'text/plain' })
    addFiles([textFile])
    setTextTitle('')
    setTextDraft('')
    setInputMode('upload')
  }

  // ── drag & drop ───────────────────────────────────────────────────────────
  function onDragOver(event: React.DragEvent) {
    event.preventDefault()
    setDragging(true)
  }
  function onDragLeave() { setDragging(false) }
  function onDrop(event: React.DragEvent) {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  // ── remove a staged (not-yet-uploaded) file ───────────────────────────────
  function removeStagedFile(index: number) {
    setStaged((prev) => prev.filter((_, i) => i !== index))
  }

  // ── upload a single staged file ───────────────────────────────────────────
  async function uploadFile(index: number) {
    setStaged((prev) =>
      prev.map((s, i) => (i === index ? { ...s, localStatus: 'uploading', error: null } : s)),
    )
    try {
      const item = staged[index]
      const res = await api.uploadDocument(item.file)
      // mark as done — job is now tracked server-side
      setStaged((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, jobId: res.job_id, localStatus: 'done' } : s,
        ),
      )
      // add to active so polling kicks off
      activeJobIds.current.add(res.job_id)
      showToast(`Uploaded "${item.file.name}" for indexing.`, 'success')
      // pull the job list immediately so it shows up
      await loadJobs(true)
    } catch (err) {
      if (isExpiredSessionError(err)) { redirectToLogin(true); return }
      const msg = err instanceof ApiError ? err.message : 'Upload failed.'
      setStaged((prev) =>
        prev.map((s, i) => (i === index ? { ...s, localStatus: 'error', error: msg } : s)),
      )
    }
  }

  // ── upload all pending staged files at once ───────────────────────────────
  async function uploadAll() {
    setUploadError('')
    const pendingIndexes = staged
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.localStatus === 'pending')
      .map(({ i }) => i)

    if (pendingIndexes.length === 0) return
    await Promise.all(pendingIndexes.map((i) => uploadFile(i)))
  }

  // ── clear staged files that already have a jobId (handed off) ─────────────
  function clearUploaded() {
    setStaged((prev) => prev.filter((s) => s.jobId === null))
  }

  const pendingCount = staged.filter((s) => s.localStatus === 'pending').length
  const uploadingCount = staged.filter((s) => s.localStatus === 'uploading').length

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch = searchQuery === '' || j.filename.toLowerCase().includes(searchQuery.toLowerCase()) || j.job_id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Top-right floating Toast notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4.5 py-3 text-xs sm:text-sm font-medium shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
            toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/95 text-emerald-100 shadow-emerald-950/30'
              : toast.type === 'error'
              ? 'border-destructive/30 bg-destructive/95 text-destructive-foreground shadow-destructive/30'
              : 'border-sky-500/30 bg-sky-950/95 text-sky-100 shadow-sky-950/30'
          }`}
        >
          {toast.type === 'success' && <Check className="size-4 shrink-0 text-emerald-400" />}
          {toast.type === 'error' && <AlertTriangle className="size-4 shrink-0 text-destructive-foreground" />}
          {toast.type === 'loading' && <Loader2 className="size-4 shrink-0 animate-spin text-sky-400" />}
          <span className="leading-snug">{toast.msg}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 rounded-lg p-1 opacity-70 hover:opacity-100 hover:bg-white/10 transition-all shrink-0"
            aria-label="Close notification"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Delete Document</h2>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">{deletingJob.filename}</strong>? This will permanently remove the file and all associated vector embeddings from your knowledge base.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setDeletingJob(null)}
                className="h-9 px-4 rounded-xl border border-border bg-background text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteJob}
                className="inline-flex h-9 items-center gap-1.5 px-4 rounded-xl bg-destructive text-white text-xs font-medium hover:bg-destructive/90 transition-colors shadow-sm"
              >
                <Trash2 className="size-3.5" />
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── header ── */}
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Knowledge base</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Documents</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Add knowledge by writing text or uploading PDF and TXT files. Everything is queued for chunking, embedding, and vector indexing.
        </p>
      </div>

      {uploadError && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />{uploadError}
        </div>
      )}

      {/* ── upload zone + staged list ── */}
      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex border-b border-border p-2" role="tablist" aria-label="Knowledge input method">
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === 'upload'}
              onClick={() => setInputMode('upload')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${inputMode === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <UploadCloud className="size-4" />Upload files
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === 'write'}
              onClick={() => setInputMode('write')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${inputMode === 'write' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <PenLine className="size-4" />Write text
            </button>
          </div>

          {inputMode === 'upload' ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`m-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 py-12 text-center transition
                ${dragging ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary hover:bg-primary/5'}`}
            >
              <UploadCloud className={`size-10 transition ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="mt-4 text-sm font-medium">Drop PDF or TXT files here, or click to browse</span>
              <span className="mt-1 text-xs text-muted-foreground">PDF or TXT files only</span>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.txt,text/plain,application/pdf"
                onChange={onInputChange}
                className="sr-only"
              />
            </div>
          ) : (
            <div className="m-5 space-y-4">
              <div>
                <label htmlFor="text-title" className="text-sm font-medium">Title / file name <span className="font-normal text-muted-foreground">(optional)</span></label>
                <input
                  id="text-title"
                  value={textTitle}
                  onChange={(event) => setTextTitle(event.target.value)}
                  placeholder="e.g. support-faq"
                  className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60"
                />
                <label htmlFor="text-ingestion" className="mt-4 block text-sm font-medium">Text to ingest</label>
                <p className="mt-1 text-xs text-muted-foreground">Your text will be packaged as a TXT file and sent through the same ingestion endpoint.</p>
              </div>
              <textarea
                id="text-ingestion"
                value={textDraft}
                onChange={(event) => {
                  setTextDraft(event.target.value)
                  if (uploadError) setUploadError('')
                }}
                placeholder="Paste product notes, FAQs, policies, or other knowledge here…"
                rows={10}
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={stageText}
                  disabled={!textDraft.trim()}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText className="size-4" />Add text to queue
                </button>
              </div>
            </div>
          )}

          {/* staged file list */}
          {staged.length > 0 && (
            <div className="border-t border-border">
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-medium">
                  Staged files <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">{staged.length}</span>
                </span>
                {staged.some((s) => s.jobId !== null) && (
                  <button onClick={clearUploaded} className="text-xs text-muted-foreground hover:text-foreground">
                    Clear uploaded
                  </button>
                )}
              </div>
              <div className="divide-y divide-border">
                {staged.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 px-5 py-3">
                    <FileText className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.file.name}</span>
                      <span className="block text-xs text-muted-foreground">{formatSize(item.file.size)}</span>
                      {item.error && <span className="block text-xs text-destructive">{item.error}</span>}
                    </span>

                    {/* status indicator */}
                    {item.localStatus === 'pending' && (
                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Pending</span>
                    )}
                    {item.localStatus === 'uploading' && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-700">
                        <Loader2 className="size-3 animate-spin" />Uploading
                      </span>
                    )}
                    {item.localStatus === 'done' && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="size-3" />Uploaded
                      </span>
                    )}
                    {item.localStatus === 'error' && (
                      <button
                        onClick={() => uploadFile(index)}
                        className="shrink-0 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
                      >
                        Retry
                      </button>
                    )}

                    {/* remove button (only when not uploading) */}
                    {item.localStatus !== 'uploading' && (
                      <button
                        onClick={() => removeStagedFile(index)}
                        aria-label="Remove file"
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* upload button */}
              <div className="border-t border-border p-5">
                <button
                  onClick={uploadAll}
                  disabled={pendingCount === 0 || uploadingCount > 0}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  {uploadingCount > 0
                    ? <><Loader2 className="size-4 animate-spin" />Uploading {uploadingCount} file{uploadingCount !== 1 ? 's' : ''}…</>
                    : <><UploadCloud className="size-4" />Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>

        {/* pipeline sidebar */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold">Ingestion pipeline</h2>
          <div className="mt-5 space-y-4">
            {[
              { step: 'Upload file', icon: UploadCloud },
              { step: 'Queue background job', icon: Clock },
              { step: 'Extract & chunk text', icon: FileText },
              { step: 'Create embeddings', icon: Zap },
              { step: 'Store in vector index', icon: CheckCircle2 },
            ].map(({ step, icon: Icon }, index) => (
              <div key={step} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── job list ── */}
      <section className="rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-semibold">Document jobs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {jobsTotal > 0 ? `${jobsTotal} job${jobsTotal !== 1 ? 's' : ''} total` : 'Processing jobs appear here after upload.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search filter */}
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search filename…"
                className="h-9 w-full rounded-xl border border-input bg-background pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-ring/60"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring/60"
            >
              <option value="all">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            <button
              onClick={() => loadJobs()}
              disabled={jobsLoading}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors shrink-0"
            >
              {jobsLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Refresh
            </button>
          </div>
        </div>

        {jobsError && (
          <div role="alert" className="flex items-center gap-2 border-b border-border bg-destructive/5 px-5 py-3 text-sm text-destructive">
            <ServerCrash className="size-4 shrink-0" />{jobsError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Filename</th>
                <th className="px-5 py-3">Job ID</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Updated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobsLoading && (
                <tr className="border-t border-border">
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin text-primary" />
                    Loading jobs…
                  </td>
                </tr>
              )}

              {!jobsLoading && filteredJobs.length === 0 && (
                <tr className="border-t border-border">
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' ? 'No document jobs match your filter.' : 'No document jobs yet. Upload a file to get started.'}
                  </td>
                </tr>
              )}

              {!jobsLoading && filteredJobs.map((job) => {
                const isDeletingThis = deletingJobIds.has(job.job_id)
                return (
                  <tr
                    key={job.job_id}
                    className={`border-t border-border transition-colors ${
                      isDeletingThis ? 'bg-destructive/5 opacity-60' : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 shrink-0 text-primary" />
                        <span className="max-w-[220px] truncate font-medium">{job.filename}</span>
                      </div>
                      {job.error_message && (
                        <p className="mt-1 text-xs text-destructive">{job.error_message}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {job.job_id.length > 16 ? `${job.job_id.slice(0, 8)}…${job.job_id.slice(-6)}` : job.job_id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {isDeletingThis ? (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                            <Loader2 className="size-3 animate-spin" /> Deleting…
                          </span>
                        ) : (
                          <>
                            {(job.status === 'queued' || job.status === 'processing') && (
                              <Loader2 className="size-3 animate-spin text-sky-600" />
                            )}
                            <StatusBadge status={job.status} />
                          </>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{formatDate(job.created_at)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{formatDate(job.updated_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setDeletingJob(job)}
                        disabled={isDeletingThis}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                        title="Delete document & vector embeddings"
                      >
                        {isDeletingThis ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                        {isDeletingThis ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

