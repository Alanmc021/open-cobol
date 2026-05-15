import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import type { CodeAgentState } from '../state.js'
import type { ValidationResult } from '../types.js'

export async function validateNode(state: CodeAgentState): Promise<Partial<CodeAgentState>> {
  if (state.error) return {}

  if (state.options?.validate === false) {
    return {
      validationResult: { passed: true, testCount: 0, passCount: 0, failCount: 0, errors: [] },
    }
  }

  if (state.targetLanguage !== 'typescript') {
    return {
      validationResult: {
        passed: true,
        testCount: 0,
        passCount: 0,
        failCount: 0,
        errors: [`Validation not implemented for ${state.targetLanguage} — skipped`],
      },
    }
  }

  const tmpDir = join(tmpdir(), `opencobol-validate-${randomUUID()}`)
  try {
    mkdirSync(tmpDir, { recursive: true })

    for (const file of [...state.sourceFiles, ...state.testFiles]) {
      const filePath = join(tmpDir, file.path)
      mkdirSync(join(tmpDir, file.path.split('/').slice(0, -1).join('/')), { recursive: true })
      writeFileSync(filePath, file.content, 'utf-8')
    }

    // Write a minimal package.json + tsconfig for the tmp project
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({ type: 'module', dependencies: { '@nestjs/common': '*', 'class-validator': '*' } }),
    )
    writeFileSync(
      join(tmpDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          noEmit: true,
        },
      }),
    )

    // Type-check first
    const tscResult = spawnSync('npx', ['tsc', '--noEmit'], {
      cwd: tmpDir,
      encoding: 'utf-8',
      timeout: 30_000,
    })

    if (tscResult.status !== 0) {
      const errors = (tscResult.stdout + tscResult.stderr)
        .split('\n')
        .filter(Boolean)
        .slice(0, 20)
      return {
        validationResult: { passed: false, testCount: 0, passCount: 0, failCount: errors.length, errors },
      }
    }

    // Run tests
    const vitestResult = spawnSync(
      'npx',
      ['vitest', 'run', '--reporter', 'json', '--outputFile', 'test-results.json'],
      { cwd: tmpDir, encoding: 'utf-8', timeout: 60_000 },
    )

    const validationResult = parseVitestOutput(vitestResult.stdout, vitestResult.stderr)
    return { validationResult }
  } catch (e) {
    return {
      validationResult: {
        passed: false,
        testCount: 0,
        passCount: 0,
        failCount: 1,
        errors: [(e as Error).message],
      },
    }
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }) } catch {}
  }
}

function parseVitestOutput(stdout: string, stderr: string): ValidationResult {
  try {
    const json = JSON.parse(stdout)
    const testCount: number = json.numTotalTests ?? 0
    const passCount: number = json.numPassedTests ?? 0
    const failCount: number = json.numFailedTests ?? 0
    const errors: string[] = []
    if (json.testResults) {
      for (const suite of json.testResults) {
        for (const test of suite.testResults ?? []) {
          if (test.status === 'failed') {
            errors.push(`${test.fullName}: ${test.failureMessages?.join(' ')}`)
          }
        }
      }
    }
    return { passed: failCount === 0, testCount, passCount, failCount, errors }
  } catch {
    const lines = (stdout + stderr).split('\n').filter(Boolean).slice(0, 20)
    return { passed: false, testCount: 0, passCount: 0, failCount: 1, errors: lines }
  }
}
