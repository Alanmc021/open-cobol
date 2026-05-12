import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import type { ChunkPayload } from '../store/qdrant.js'

export interface JclChunk {
  id: string
  content: string
  payload: ChunkPayload
}

function djb2(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

function chunkId(filePath: string, descriptor: string): string {
  const a = djb2(filePath)
  const b = djb2(descriptor)
  return `${a}-${b.slice(0, 4)}-4${b.slice(4, 7)}-8${a.slice(0, 3)}-${b}${a.slice(0, 4)}`
}

interface JclStep {
  stepName: string
  program: string | null
  proc: string | null
  lines: string[]
  lineStart: number
  lineEnd: number
}

function parseJclSteps(sourceLines: string[]): { jobName: string | null; steps: JclStep[] } {
  let jobName: string | null = null
  const steps: JclStep[] = []
  let currentStep: JclStep | null = null

  for (let i = 0; i < sourceLines.length; i++) {
    const line = sourceLines[i] ?? ''

    // Skip comment lines (//* ...)
    if (line.startsWith('//*')) continue

    // JOB card: //JOBNAME JOB ...
    const jobMatch = /^\/\/([A-Z0-9@#$]{1,8})\s+JOB\s/i.exec(line)
    if (jobMatch && !jobName) {
      jobName = jobMatch[1]?.toUpperCase() ?? null
      continue
    }

    // EXEC card: //STEPNAME EXEC PGM=... or //STEPNAME EXEC PROCNAME
    const execMatch = /^\/\/([A-Z0-9@#$]{1,8})\s+EXEC\s+(?:PGM=([A-Z0-9@#$-]+)|([A-Z0-9@#$-]+))/i.exec(line)
    if (execMatch) {
      if (currentStep) {
        currentStep.lineEnd = i - 1
        steps.push(currentStep)
      }
      currentStep = {
        stepName: execMatch[1]?.toUpperCase() ?? `STEP${steps.length + 1}`,
        program: execMatch[2]?.toUpperCase() ?? null,
        proc: execMatch[3]?.toUpperCase() ?? null,
        lines: [line],
        lineStart: i,
        lineEnd: i,
      }
      continue
    }

    // Continuation/DD lines belong to current step
    if (currentStep && line.startsWith('//')) {
      currentStep.lines.push(line)
    }
  }

  if (currentStep) {
    currentStep.lineEnd = sourceLines.length - 1
    steps.push(currentStep)
  }

  return { jobName, steps }
}

export function chunkJclFile(filePath: string): JclChunk[] {
  const source = readFileSync(filePath, 'utf-8')
  const sourceLines = source.split('\n')
  const { jobName, steps } = parseJclSteps(sourceLines)
  const chunks: JclChunk[] = []
  const fileName = basename(filePath)

  // If no steps found, treat whole file as one chunk
  if (steps.length === 0) {
    const content = [
      `[JCL Job: ${jobName ?? fileName}]`,
      `File: ${fileName}`,
      '',
      source.trim(),
    ].join('\n')
    chunks.push({
      id: chunkId(filePath, 'jcl-full'),
      content,
      payload: {
        file: fileName,
        programId: jobName,
        chunkType: 'jcl-step',
        performs: [],
        calls: [],
        content,
        lineStart: 0,
        lineEnd: sourceLines.length - 1,
      },
    })
    return chunks
  }

  // One chunk per JCL step
  for (const step of steps) {
    const target = step.program ?? step.proc ?? 'UNKNOWN'
    const stepSource = step.lines.join('\n')

    // Extract datasets referenced in DD statements
    const datasets: string[] = []
    for (const line of step.lines) {
      const dsn = /DSN=([A-Z0-9.@#$-]+)/i.exec(line)
      if (dsn?.[1]) datasets.push(dsn[1].toUpperCase())
    }

    const content = [
      `[JCL Job: ${jobName ?? fileName} | Step: ${step.stepName} | Program: ${target}]`,
      `File: ${fileName}`,
      `Calls program: ${target}`,
      datasets.length > 0 ? `Datasets: ${datasets.join(', ')}` : null,
      '',
      stepSource,
    ]
      .filter(Boolean)
      .join('\n')

    chunks.push({
      id: chunkId(filePath, `step::${step.stepName}`),
      content,
      payload: {
        file: fileName,
        programId: jobName,
        chunkType: 'jcl-step',
        paragraphName: step.stepName,
        performs: [],
        calls: [target],
        content,
        lineStart: step.lineStart,
        lineEnd: step.lineEnd,
      },
    })
  }

  return chunks
}
