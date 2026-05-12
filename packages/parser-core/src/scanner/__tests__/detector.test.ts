import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { analyzeFile } from '../detector.js'

const TMP = '/tmp/opencobol-test'

const SAMPLE_PROGRAM = `
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CUSTOMER.
       ENVIRONMENT DIVISION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       PROCEDURE DIVISION.
           COPY COMMON.
           COPY HEADER.
           CALL 'DBACCESS' USING WS-DATA.
           CALL 'LOGGER'.
           STOP RUN.
`

const SAMPLE_COPYBOOK = `
       01 WS-COMMON-DATA.
          05 WS-ID        PIC 9(8).
          05 WS-NAME      PIC X(30).
`

beforeEach(() => {
  mkdirSync(TMP, { recursive: true })
})

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true })
})

describe('analyzeFile', () => {
  it('extracts program-id from a .cbl file', () => {
    const path = join(TMP, 'CUSTOMER.cbl')
    writeFileSync(path, SAMPLE_PROGRAM)
    const result = analyzeFile(path)
    expect(result.programId).toBe('CUSTOMER')
    expect(result.type).toBe('program')
  })

  it('extracts copybook references', () => {
    const path = join(TMP, 'CUSTOMER.cbl')
    writeFileSync(path, SAMPLE_PROGRAM)
    const result = analyzeFile(path)
    expect(result.copybooks).toEqual(expect.arrayContaining(['COMMON', 'HEADER']))
  })

  it('extracts CALL targets', () => {
    const path = join(TMP, 'CUSTOMER.cbl')
    writeFileSync(path, SAMPLE_PROGRAM)
    const result = analyzeFile(path)
    expect(result.calls).toEqual(expect.arrayContaining(['DBACCESS', 'LOGGER']))
  })

  it('detects copybook type from .cpy extension', () => {
    const path = join(TMP, 'COMMON.cpy')
    writeFileSync(path, SAMPLE_COPYBOOK)
    const result = analyzeFile(path)
    expect(result.type).toBe('copybook')
    expect(result.programId).toBeNull()
  })
})
