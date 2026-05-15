import { readFileSync } from 'node:fs'
import type { DataDivision, DataField, DataSection } from '@opencobol/shared'

const DATA_DIVISION_RE = /^\s*DATA\s+DIVISION\b/i
const PROCEDURE_DIVISION_RE = /^\s*PROCEDURE\s+DIVISION\b/i
const SECTION_RE = /^\s*(WORKING-STORAGE|FILE|LINKAGE|LOCAL-STORAGE)\s+SECTION\b/i

// Matches: <whitespace> <level> <whitespace> <name> <rest>
// Level 01-49, 66, 77, 88
const FIELD_RE = /^\s+(\d{1,2})\s+([A-Z0-9][A-Z0-9-]*)\b(.*)/i

// PIC / PICTURE IS <clause> — captures just the picture string (e.g. S9(10)V99)
// Excludes trailing period which is the COBOL statement terminator
const PIC_RE = /\bPIC(?:TURE)?\s+(?:IS\s+)?([\w()V]+)/i

// USAGE (IS)? <comp> or bare <comp> keyword
const USAGE_RE = /\b(?:USAGE\s+(?:IS\s+)?)?(COMP(?:-[1-5])?|BINARY|DISPLAY|PACKED-DECIMAL)\b/i

// VALUE (IS)? <literal-or-word>
const VALUE_RE = /\bVALUE\s+(?:IS\s+)?(['"][^'"]*['"]|[\w-]+)/i

function parseLines(lines: string[]): DataDivision {
  let inDataDivision = false
  let currentSection: DataSection = 'WORKING-STORAGE'
  const fields: DataField[] = []

  for (const line of lines) {
    if (line[6] === '*') continue

    if (PROCEDURE_DIVISION_RE.test(line)) break

    if (DATA_DIVISION_RE.test(line)) {
      inDataDivision = true
      continue
    }

    if (!inDataDivision) continue

    const sectionMatch = SECTION_RE.exec(line)
    if (sectionMatch) {
      currentSection = sectionMatch[1]!.toUpperCase() as DataSection
      continue
    }

    const fieldMatch = FIELD_RE.exec(line)
    if (!fieldMatch) continue

    const level = parseInt(fieldMatch[1]!, 10)
    const name = fieldMatch[2]!.toUpperCase()
    const rest = fieldMatch[3] ?? ''

    const picMatch = PIC_RE.exec(rest)
    const pic = picMatch?.[1]?.toUpperCase() ?? null

    const usageMatch = USAGE_RE.exec(rest)
    const usage = usageMatch?.[1]?.toUpperCase() ?? null

    const valueMatch = VALUE_RE.exec(rest)
    const value = valueMatch?.[1] ?? null

    fields.push({ level, name, pic, usage, value, section: currentSection })
  }

  return {
    fields,
    workingStorage: fields.filter((f) => f.section === 'WORKING-STORAGE'),
    linkage: fields.filter((f) => f.section === 'LINKAGE'),
    fileSection: fields.filter((f) => f.section === 'FILE'),
  }
}

export function parseDataDivisionFromSource(source: string): DataDivision {
  return parseLines(source.split('\n'))
}

export function parseDataDivision(filePath: string): DataDivision {
  const source = readFileSync(filePath, 'utf-8')
  return parseDataDivisionFromSource(source)
}
