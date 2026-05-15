import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const FIXTURES = join(ROOT, 'examples/legacy')
const PAYROLL = join(FIXTURES, 'PAYROLL.cbl')
const HAS_OPENAI = !!process.env.OPENAI_API_KEY

// ── helper ────────────────────────────────────────────────────────────────────

function cli(args: string[], env?: Record<string, string>) {
  // Use source via pnpm so new commands (not yet published to npm) are available
  return spawnSync('pnpm', ['opencobol', ...args], {
    cwd: ROOT,
    encoding: 'utf-8',
    env: { ...process.env, ...env },
    timeout: 60_000,
  })
}

// ── version / help ────────────────────────────────────────────────────────────

describe('opencobol --version', () => {
  it('prints a semver version', () => {
    const result = cli(['--version'])
    expect(result.status).toBe(0)
    expect(result.stdout.trim()).toMatch(/\d+\.\d+\.\d+/)
  })
})

describe('opencobol --help', () => {
  it('lists all available commands', () => {
    const result = cli(['--help'])
    expect(result.status).toBe(0)
    const output = result.stdout + result.stderr
    expect(output).toMatch(/scan/)
    expect(output).toMatch(/explain/)
    expect(output).toMatch(/embed/)
    expect(output).toMatch(/ask/)
  })
})

// ── scan ──────────────────────────────────────────────────────────────────────

describe('opencobol scan', () => {
  it('detects COBOL files in the legacy fixtures', () => {
    const result = cli(['scan', FIXTURES])
    expect(result.status).toBe(0)
    const output = result.stdout + result.stderr
    expect(output).toMatch(/PAYROLL\.cbl/i)
    expect(output).toMatch(/CUSTOMER\.cbl/i)
    expect(output).toMatch(/INVENTORY\.cbl/i)
  })

  it('reports copybook count > 0', () => {
    const result = cli(['scan', FIXTURES])
    expect(result.status).toBe(0)
    expect(result.stdout + result.stderr).toMatch(/copybook/i)
  })

  it('exits non-zero for missing path', () => {
    const result = cli(['scan', '/tmp/does-not-exist-opencobol'])
    expect(result.status).not.toBe(0)
  })
})

// ── flow ──────────────────────────────────────────────────────────────────────

describe('opencobol flow', () => {
  it('prints paragraph flow for PAYROLL.cbl', () => {
    const result = cli(['flow', PAYROLL])
    expect(result.status).toBe(0)
    const output = result.stdout + result.stderr
    expect(output).toMatch(/MAIN-PARA|CALC-GROSS|PAYROLL/i)
  })
})

// ── explain ───────────────────────────────────────────────────────────────────

describe.skipIf(!HAS_OPENAI)('opencobol explain (requires OPENAI_API_KEY)', () => {
  it('returns a non-empty explanation for PAYROLL.cbl', () => {
    const result = cli(['explain', PAYROLL])
    expect(result.status).toBe(0)
    const output = result.stdout + result.stderr
    expect(output.length).toBeGreaterThan(100)
    // Must mention something about payroll / salary / employee
    expect(output.toLowerCase()).toMatch(/payroll|salary|employee|calcul/i)
  })
})

// ── embed ─────────────────────────────────────────────────────────────────────

describe.skipIf(!HAS_OPENAI)('opencobol embed (requires OPENAI_API_KEY + Qdrant)', () => {
  it('indexes the legacy fixtures into Qdrant', () => {
    const result = cli(['embed', FIXTURES, '--collection', 'opencobol-e2e'], {
      QDRANT_URL: 'http://localhost:6333',
    })
    expect(result.status).toBe(0)
    const output = result.stdout + result.stderr
    expect(output).toMatch(/indexed|done|chunk/i)
  })
})

// ── generate-api ──────────────────────────────────────────────────────────────

describe.skipIf(!HAS_OPENAI)('opencobol generate-api (requires OPENAI_API_KEY)', () => {
  it('generates NestJS files for PAYROLL.cbl', () => {
    const outDir = join(ROOT, 'tmp-e2e-generated')
    const result = cli(['generate-api', PAYROLL, '--output-dir', outDir])
    expect(result.status).toBe(0)
    const output = result.stdout + result.stderr
    expect(output).toMatch(/Generated \d+ files/)
    expect(output).toMatch(/\.controller\.ts/)
    expect(output).toMatch(/\.service\.ts/)
  })
})
