import { describe, it, expect, beforeAll } from 'vitest'

const BASE = process.env.API_URL ?? 'http://localhost:3001/api'
// API runs in Docker — examples/ is mounted at /data/examples
const FIXTURES = process.env.API_FIXTURES_PATH ?? '/data/examples/legacy'
const HAS_OPENAI = !!process.env.OPENAI_API_KEY

// ── helpers ──────────────────────────────────────────────────────────────────

async function post(path: string, body: unknown) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function get(path: string) {
  return fetch(`${BASE}${path}`)
}

// ── boot check ───────────────────────────────────────────────────────────────

beforeAll(async () => {
  const res = await get('/health').catch(() => null)
  if (!res?.ok) {
    throw new Error('API not reachable — run: docker compose up -d')
  }
})

// ── health ────────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns status ok with version and timestamp', async () => {
    const res = await get('/health')
    const body = await res.json() as Record<string, unknown>

    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(typeof body.version).toBe('string')
    expect(typeof body.timestamp).toBe('string')
    expect(new Date(body.timestamp as string).getTime()).not.toBeNaN()
  })
})

// ── scan ──────────────────────────────────────────────────────────────────────

describe('POST /api/scan', () => {
  it('returns files and stats for the legacy fixtures', async () => {
    const res = await post('/scan', { path: FIXTURES })
    const body = await res.json() as Record<string, unknown>

    expect(res.status).toBe(201)
    expect(body.rootPath).toBe(FIXTURES)

    const files = body.files as Array<{ name: string; type: string }>
    const names = files.map((f) => f.name)
    expect(names).toContain('PAYROLL.cbl')
    expect(names).toContain('CUSTOMER.cbl')
    expect(names).toContain('INVENTORY.cbl')
    expect(names.some((n) => n.endsWith('.cpy'))).toBe(true)

    const stats = body.stats as Record<string, number>
    expect(stats.programs).toBeGreaterThanOrEqual(3)
    expect(stats.copybooks).toBeGreaterThanOrEqual(1)
    expect(stats.totalLines).toBeGreaterThan(0)
  })

  it('PAYROLL.cbl has correct type and copybook references', async () => {
    const res = await post('/scan', { path: FIXTURES })
    const body = await res.json() as Record<string, unknown>
    const files = body.files as Array<{ name: string; type: string; copybooks: string[] }>
    const payroll = files.find((f) => f.name === 'PAYROLL.cbl')

    expect(payroll).toBeDefined()
    expect(payroll!.type).toBe('program')
    expect(payroll!.copybooks.length).toBeGreaterThan(0)
  })

  it('returns 500 for non-existent path', async () => {
    const res = await post('/scan', { path: '/tmp/does-not-exist-opencobol' })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})

// ── embed ─────────────────────────────────────────────────────────────────────

describe.skipIf(!HAS_OPENAI)('POST /api/embed (requires OPENAI_API_KEY)', () => {
  let jobId: string

  it('starts an indexing job and returns a jobId', async () => {
    // omit qdrantUrl — API container uses QDRANT_URL=http://qdrant:6333 from env
    const res = await post('/embed', {
      path: FIXTURES,
      collection: 'opencobol-e2e',
    })
    const body = await res.json() as Record<string, unknown>

    expect(res.status).toBe(201)
    expect(typeof body.jobId).toBe('string')
    jobId = body.jobId as string
  })

  it('GET /api/embed/:id returns job status', async () => {
    const res = await get(`/embed/${jobId}`)
    const body = await res.json() as Record<string, unknown>

    expect(res.status).toBe(200)
    expect(['running', 'done', 'error']).toContain(body.status)
  })

  it('job completes successfully within 60s', async () => {
    const deadline = Date.now() + 60_000
    let status = 'running'

    while (status === 'running' && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2_000))
      const res = await get(`/embed/${jobId}`)
      const body = await res.json() as Record<string, unknown>
      status = body.status as string
    }

    expect(status).toBe('done')
  })
})

// ── explain ───────────────────────────────────────────────────────────────────

describe.skipIf(!HAS_OPENAI)('POST /api/explain (requires OPENAI_API_KEY)', () => {
  it('returns a non-empty explanation for PAYROLL.cbl', async () => {
    const filePath = `${FIXTURES}/PAYROLL.cbl`
    const res = await post('/explain', { filePath })
    const body = await res.json() as Record<string, unknown>

    expect(res.status).toBe(201)
    expect(typeof body.explanation).toBe('string')
    expect((body.explanation as string).length).toBeGreaterThan(100)
  })
})

// ── generate-api ──────────────────────────────────────────────────────────────

describe.skipIf(!HAS_OPENAI)('POST /api/generate-api (requires OPENAI_API_KEY)', () => {
  it('returns NestJS files and endpoints for PAYROLL.cbl', async () => {
    const filePath = `${FIXTURES}/PAYROLL.cbl`
    const res = await post('/generate-api', { filePath, framework: 'nestjs' })
    const body = await res.json() as Record<string, unknown>

    expect(res.status).toBe(201)
    expect(typeof body.programName).toBe('string')
    expect(body.endpoints).toBeInstanceOf(Array)
    expect((body.endpoints as unknown[]).length).toBeGreaterThan(0)
    expect(typeof body.files).toBe('object')
    const files = Object.keys(body.files as Record<string, string>)
    expect(files.some((f) => f.endsWith('.controller.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('.service.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('.dto.ts'))).toBe(true)
  })

  it('second call returns cached result instantly', async () => {
    const filePath = `${FIXTURES}/PAYROLL.cbl`
    const start = Date.now()
    const res = await post('/generate-api', { filePath, framework: 'nestjs' })
    const elapsed = Date.now() - start
    expect(res.status).toBe(201)
    expect(elapsed).toBeLessThan(2_000) // cached — should be near-instant
  })
})

// ── ask ───────────────────────────────────────────────────────────────────────

describe.skipIf(!HAS_OPENAI)('POST /api/ask (requires OPENAI_API_KEY + indexed docs)', () => {
  it('answers a question about the COBOL codebase', async () => {
    // omit qdrantUrl — API container uses QDRANT_URL=http://qdrant:6333 from env
    const res = await post('/ask', {
      question: 'What does the PAYROLL program do?',
      collection: 'opencobol-e2e',
    })
    const body = await res.json() as Record<string, unknown>

    expect(res.status).toBe(201)
    expect(typeof body.answer).toBe('string')
    expect((body.answer as string).length).toBeGreaterThan(20)
  })
})
