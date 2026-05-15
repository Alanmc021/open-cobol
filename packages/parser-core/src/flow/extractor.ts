import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import type { CobolParagraph, FlowResult } from '@opencobol/shared'
import { analyzeFile } from '../scanner/detector.js'

// Paragraph header: area-A indentation (6–8 spaces) + NAME + lone period.
// COBOL area A = columns 8–11 (1-indexed) = 7–10 (0-indexed), so ~7 leading spaces.
// Scope terminators like END-IF live in area B (11+ spaces) and are excluded separately.
// COBOL paragraphs can start with a letter OR digit (e.g. 1200-COMPUTE-INTEREST)
const PARA_HEADER_RE = /^[ \t]{6,8}([A-Z0-9][A-Z0-9-]*)\.[ \t]*$/

// COBOL scope terminators that can appear at area-A indentation with a trailing period
const SCOPE_TERMINATORS = new Set([
  'END-IF',
  'END-PERFORM',
  'END-EVALUATE',
  'END-READ',
  'END-WRITE',
  'END-COMPUTE',
  'END-CALL',
  'END-STRING',
  'END-UNSTRING',
  'END-MULTIPLY',
  'END-DIVIDE',
  'END-ADD',
  'END-SUBTRACT',
  'END-SEARCH',
])

// Words that look like paragraphs but are division/section markers
const STRUCTURAL_KEYWORDS = new Set([
  'IDENTIFICATION',
  'ENVIRONMENT',
  'DATA',
  'PROCEDURE',
  'WORKING-STORAGE',
  'FILE',
  'LINKAGE',
  'COMMUNICATION',
  'LOCAL-STORAGE',
  'SCREEN',
  'REPORT',
  'CONFIGURATION',
  'INPUT-OUTPUT',
])

// PERFORM NAME — captures the target paragraph name
// Stops at THRU / THROUGH / UNTIL / VARYING / WITH / TIMES
const PERFORM_RE = /\bPERFORM\s+([A-Z0-9][A-Z0-9-]*)(?:\s+(?:THRU|THROUGH|UNTIL|VARYING|WITH|TIMES)\b)?/gi

// CALL 'NAME' or CALL "NAME"
const CALL_RE = /\bCALL\s+['"]([A-Z0-9][A-Z0-9-]*)['"]|\bCALL\s+([A-Z][A-Z0-9-]*)\b/gi

function isParagraphHeader(line: string): string | null {
  if (/\bDIVISION\b|\bSECTION\b/i.test(line)) return null
  const m = PARA_HEADER_RE.exec(line)
  if (!m) return null
  const name = m[1]!.toUpperCase()
  if (STRUCTURAL_KEYWORDS.has(name)) return null
  if (SCOPE_TERMINATORS.has(name)) return null
  return name
}

function extractPerforms(lines: string[]): string[] {
  const performs: string[] = []
  const seen = new Set<string>()
  for (const line of lines) {
    PERFORM_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = PERFORM_RE.exec(line)) !== null) {
      const name = m[1]?.toUpperCase()
      if (name && !seen.has(name)) {
        seen.add(name)
        performs.push(name)
      }
    }
  }
  return performs
}

function extractCalls(lines: string[]): string[] {
  const calls: string[] = []
  const seen = new Set<string>()
  for (const line of lines) {
    CALL_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = CALL_RE.exec(line)) !== null) {
      const name = (m[1] ?? m[2])?.toUpperCase()
      if (name && !seen.has(name)) {
        seen.add(name)
        calls.push(name)
      }
    }
  }
  return calls
}

function sliceProcedureDivision(lines: string[]): string[] {
  const idx = lines.findIndex((l) => /\bPROCEDURE\s+DIVISION\b/i.test(l))
  return idx === -1 ? [] : lines.slice(idx + 1)
}

export function extractFlow(filePath: string): FlowResult {
  const content = readFileSync(filePath, 'utf-8')
  const allLines = content.split('\n')
  const procLines = sliceProcedureDivision(allLines)
  const meta = analyzeFile(filePath)

  const paragraphs: CobolParagraph[] = []
  let currentName: string | null = null
  let currentStart = 0
  let bodyLines: string[] = []

  const flush = (endIdx: number) => {
    if (currentName === null) return
    paragraphs.push({
      name: currentName,
      performs: extractPerforms(bodyLines),
      calls: extractCalls(bodyLines),
      lineStart: currentStart,
      lineEnd: endIdx,
    })
    bodyLines = []
  }

  procLines.forEach((line, i) => {
    // Skip comment lines (column 7 = '*' in fixed format)
    if (line[6] === '*') return

    const paraName = isParagraphHeader(line)
    if (paraName) {
      flush(i - 1)
      currentName = paraName
      currentStart = i
    } else if (currentName !== null) {
      bodyLines.push(line)
    }
  })
  flush(procLines.length - 1)

  return {
    programId: meta.programId,
    fileName: basename(filePath),
    entryPoint: paragraphs[0]?.name ?? null,
    paragraphs,
  }
}
