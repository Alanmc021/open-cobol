import { readFileSync, statSync } from 'node:fs'
import { extname, basename } from 'node:path'
import type { CobolFile, CobolFileType } from '@opencobol/shared'

const PROGRAM_EXTENSIONS = new Set(['.cbl', '.cob', '.cobol'])
const COPYBOOK_EXTENSIONS = new Set(['.cpy', '.copy'])
const JCL_EXTENSIONS = new Set(['.jcl', '.jcllib', '.jclproc'])

// Matches PROGRAM-ID. PROGNAME or PROGRAM-ID. "PROGNAME".
const PROGRAM_ID_RE = /PROGRAM-ID\.\s+["']?([A-Z0-9][A-Z0-9-]*)["']?/i

// Matches: COPY BOOKNAME or COPY "BOOKNAME"
const COPY_RE = /\bCOPY\s+["']?([A-Z0-9][A-Z0-9-]*)["']?/gi

// Matches: CALL 'PROGNAME' or CALL "PROGNAME" or CALL PROGNAME
const CALL_RE = /\bCALL\s+["']([A-Z0-9][A-Z0-9-]*)["']|\bCALL\s+([A-Z0-9][A-Z0-9-]*)\b/gi

// JCL: EXEC PGM=PROGNAME or EXEC PROCNAME
const JCL_EXEC_RE = /\/\/\S+\s+EXEC\s+(?:PGM=([A-Z0-9@#$-]+)|([A-Z0-9@#$-]+))/gi

function detectType(filePath: string, content: string): CobolFileType {
  const ext = extname(filePath).toLowerCase()
  if (PROGRAM_EXTENSIONS.has(ext)) return 'program'
  if (COPYBOOK_EXTENSIONS.has(ext)) return 'copybook'
  if (JCL_EXTENSIONS.has(ext)) return 'jcl'
  // Detect JCL by content: first non-blank line starts with //
  const firstMeaningfulLine = content.split('\n').find((l) => l.trim().length > 0) ?? ''
  if (firstMeaningfulLine.startsWith('//')) return 'jcl'
  return 'unknown'
}

export function analyzeFile(filePath: string): CobolFile {
  const stat = statSync(filePath)
  const content = readFileSync(filePath, 'utf-8')
  const type = detectType(filePath, content)

  const programIdMatch = PROGRAM_ID_RE.exec(content)
  const programId = programIdMatch?.[1]?.toUpperCase() ?? null

  const copybooks = new Set<string>()
  COPY_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = COPY_RE.exec(content)) !== null) {
    if (m[1]) copybooks.add(m[1].toUpperCase())
  }

  const calls = new Set<string>()

  if (type === 'jcl') {
    JCL_EXEC_RE.lastIndex = 0
    while ((m = JCL_EXEC_RE.exec(content)) !== null) {
      const name = m[1] ?? m[2]
      if (name) calls.add(name.toUpperCase())
    }
  } else {
    CALL_RE.lastIndex = 0
    while ((m = CALL_RE.exec(content)) !== null) {
      const name = m[1] ?? m[2]
      if (name) calls.add(name.toUpperCase())
    }
  }

  return {
    path: filePath,
    name: basename(filePath),
    type,
    programId,
    copybooks: [...copybooks],
    calls: [...calls],
    lines: content.split('\n').length,
    sizeBytes: stat.size,
  }
}
