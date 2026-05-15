import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { extractFlow } from '@opencobol/parser-core'
import { analyzeFile } from '@opencobol/parser-core'
import type { ChunkPayload } from '../store/qdrant.js'

export interface CobolChunk {
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

// Deterministic UUID-formatted ID — Qdrant requires UUID or unsigned integer
function chunkId(filePath: string, descriptor: string): string {
  const a = djb2(filePath)
  const b = djb2(descriptor)
  return `${a}-${b.slice(0, 4)}-4${b.slice(4, 7)}-8${a.slice(0, 3)}-${b}${a.slice(0, 4)}`
}

// Conservative token estimate: 4 chars ≈ 1 token (safe for COBOL fixed-format)
const MAX_CHUNK_TOKENS = 6000
const CHARS_PER_TOKEN = 4

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

// Split oversized content into sub-chunks at line boundaries
function splitIntoSubChunks(lines: string[], maxTokens: number): string[] {
  const chunks: string[] = []
  let current: string[] = []
  let currentTokens = 0

  for (const line of lines) {
    const lineTokens = estimateTokens(line)
    if (currentTokens + lineTokens > maxTokens && current.length > 0) {
      chunks.push(current.join('\n'))
      current = []
      currentTokens = 0
    }
    current.push(line)
    currentTokens += lineTokens
  }
  if (current.length > 0) chunks.push(current.join('\n'))
  return chunks
}

function buildProgramHeader(filePath: string, sourceLines: string[]): string {
  const meta = analyzeFile(filePath)
  const procIdx = sourceLines.findIndex((l) => /\bPROCEDURE\s+DIVISION\b/i.test(l))

  // Limit header to metadata + first 150 lines of DATA DIVISION to stay under token limit
  const dataDivLines = sourceLines
    .slice(0, procIdx + 1)
    .filter((l) => l.trim() && l[6] !== '*')
  const cappedLines = dataDivLines.slice(0, 150)
  const truncated = dataDivLines.length > 150

  return [
    `[COBOL Program: ${meta.programId ?? basename(filePath)}]`,
    `File: ${basename(filePath)}`,
    `Copybooks: ${meta.copybooks.join(', ') || 'none'}`,
    `External calls: ${meta.calls.join(', ') || 'none'}`,
    truncated ? `[DATA DIVISION truncated at 150 lines — ${dataDivLines.length} total]` : '',
    '',
    cappedLines.join('\n').trim(),
  ].filter((l) => l !== '').join('\n')
}

function extractParagraphSource(sourceLines: string[], lineStart: number, lineEnd: number): string {
  return sourceLines.slice(lineStart, lineEnd + 1).join('\n').trimEnd()
}

// Chunk a copybook file by 01-level data items
function chunkCopybookFile(filePath: string): CobolChunk[] {
  const source = readFileSync(filePath, 'utf-8')
  const sourceLines = source.split('\n')
  const meta = analyzeFile(filePath)
  const chunks: CobolChunk[] = []

  // Find 01-level item boundaries (columns 7-11 in fixed COBOL, or free-format)
  const level01Indices: number[] = []
  for (let i = 0; i < sourceLines.length; i++) {
    const line = sourceLines[i] ?? ''
    const trimmed = line.trimStart()
    if (/^01\s+/i.test(trimmed) && line[6] !== '*') {
      level01Indices.push(i)
    }
  }

  if (level01Indices.length === 0) {
    // No 01-level found — emit whole file as one chunk
    const content = [
      `[COBOL Copybook: ${basename(filePath)}]`,
      `File: ${basename(filePath)}`,
      '',
      source.trim(),
    ].join('\n')
    chunks.push({
      id: chunkId(filePath, 'copybook-full'),
      content,
      payload: {
        file: basename(filePath),
        programId: meta.programId,
        chunkType: 'copybook',
        performs: [],
        calls: [],
        content,
        lineStart: 0,
        lineEnd: sourceLines.length - 1,
      },
    })
    return chunks
  }

  // One chunk per 01-level block
  for (let i = 0; i < level01Indices.length; i++) {
    const lineStart = level01Indices[i]!
    const lineEnd = (level01Indices[i + 1] ?? sourceLines.length) - 1
    const block = sourceLines.slice(lineStart, lineEnd + 1).join('\n').trimEnd()

    // Extract field name from the 01-level line
    const firstLine = sourceLines[lineStart] ?? ''
    const fieldMatch = /01\s+([A-Z0-9][A-Z0-9-]*)/i.exec(firstLine)
    const fieldName = fieldMatch?.[1]?.toUpperCase() ?? `item-${i}`

    const content = [
      `[COBOL Copybook: ${basename(filePath)} | Record: ${fieldName}]`,
      `File: ${basename(filePath)}`,
      '',
      block,
    ].join('\n')

    chunks.push({
      id: chunkId(filePath, `copybook::${fieldName}`),
      content,
      payload: {
        file: basename(filePath),
        programId: meta.programId,
        chunkType: 'copybook',
        paragraphName: fieldName,
        performs: [],
        calls: [],
        content,
        lineStart,
        lineEnd,
      },
    })
  }

  return chunks
}

function chunkProgramFile(filePath: string): CobolChunk[] {
  const source = readFileSync(filePath, 'utf-8')
  const sourceLines = source.split('\n')
  const flow = extractFlow(filePath)
  const meta = analyzeFile(filePath)
  const chunks: CobolChunk[] = []

  // Chunk 1: full program header (IDENTIFICATION + DATA DIVISION)
  const headerContent = buildProgramHeader(filePath, sourceLines)
  chunks.push({
    id: chunkId(filePath, 'program-header'),
    content: headerContent,
    payload: {
      file: basename(filePath),
      programId: meta.programId,
      chunkType: 'program-header',
      performs: [],
      calls: meta.calls,
      content: headerContent,
      lineStart: 0,
      lineEnd: sourceLines.findIndex((l) => /\bPROCEDURE\s+DIVISION\b/i.test(l)),
    },
  })

  // Chunk per paragraph — split oversized paragraphs into sub-chunks
  const procOffset = sourceLines.findIndex((l) => /\bPROCEDURE\s+DIVISION\b/i.test(l)) + 1

  for (const para of flow.paragraphs) {
    const absStart = procOffset + para.lineStart
    const absEnd = procOffset + para.lineEnd
    const code = extractParagraphSource(sourceLines, absStart, absEnd)

    const header = [
      `[COBOL Program: ${meta.programId ?? basename(filePath)} | Paragraph: ${para.name}]`,
      `Performs: ${para.performs.join(', ') || 'none'}`,
      `Calls: ${para.calls.join(', ') || 'none'}`,
      '',
    ].join('\n')

    const fullContent = header + code

    if (estimateTokens(fullContent) <= MAX_CHUNK_TOKENS) {
      chunks.push({
        id: chunkId(filePath, `para::${para.name}`),
        content: fullContent,
        payload: {
          file: basename(filePath),
          programId: meta.programId,
          chunkType: 'paragraph',
          paragraphName: para.name,
          performs: para.performs,
          calls: para.calls,
          content: fullContent,
          lineStart: absStart,
          lineEnd: absEnd,
        },
      })
    } else {
      // Oversized paragraph → split into sub-chunks
      const codeLines = code.split('\n')
      const subChunks = splitIntoSubChunks(codeLines, MAX_CHUNK_TOKENS - estimateTokens(header))
      subChunks.forEach((sub, idx) => {
        const content = header + sub
        chunks.push({
          id: chunkId(filePath, `para::${para.name}::${idx}`),
          content,
          payload: {
            file: basename(filePath),
            programId: meta.programId,
            chunkType: 'paragraph',
            paragraphName: `${para.name} (part ${idx + 1}/${subChunks.length})`,
            performs: para.performs,
            calls: para.calls,
            content,
            lineStart: absStart,
            lineEnd: absEnd,
          },
        })
      })
    }
  }

  return chunks
}

export function chunkCobolFile(filePath: string, type: 'program' | 'copybook' = 'program'): CobolChunk[] {
  if (type === 'copybook') return chunkCopybookFile(filePath)
  return chunkProgramFile(filePath)
}
