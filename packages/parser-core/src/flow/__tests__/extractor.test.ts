import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { extractFlow } from '../extractor.js'

const TMP = '/tmp/opencobol-flow-test'

const SAMPLE = `
       IDENTIFICATION DIVISION.
       PROGRAM-ID. PAYROLL.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-ID PIC 9(8).
       PROCEDURE DIVISION.
       MAIN-PARA.
           PERFORM INIT-PARA
           PERFORM CALC-PARA
           STOP RUN.
       INIT-PARA.
           CALL 'DBACCESS' USING WS-ID.
           CALL 'LOGGER'.
       CALC-PARA.
           PERFORM WRITE-PARA.
       WRITE-PARA.
           CALL 'PRINT-SERVICE'.
           CALL 'DBCLOSE'.
`

beforeEach(() => mkdirSync(TMP, { recursive: true }))
afterEach(() => rmSync(TMP, { recursive: true, force: true }))

describe('extractFlow', () => {
  it('detects all paragraphs', () => {
    const path = join(TMP, 'PAYROLL.cbl')
    writeFileSync(path, SAMPLE)
    const result = extractFlow(path)
    const names = result.paragraphs.map((p) => p.name)
    expect(names).toEqual(['MAIN-PARA', 'INIT-PARA', 'CALC-PARA', 'WRITE-PARA'])
  })

  it('sets entry point to first paragraph', () => {
    const path = join(TMP, 'PAYROLL.cbl')
    writeFileSync(path, SAMPLE)
    const result = extractFlow(path)
    expect(result.entryPoint).toBe('MAIN-PARA')
  })

  it('extracts PERFORM targets per paragraph', () => {
    const path = join(TMP, 'PAYROLL.cbl')
    writeFileSync(path, SAMPLE)
    const result = extractFlow(path)
    const main = result.paragraphs.find((p) => p.name === 'MAIN-PARA')!
    expect(main.performs).toEqual(['INIT-PARA', 'CALC-PARA'])
  })

  it('extracts CALL targets per paragraph', () => {
    const path = join(TMP, 'PAYROLL.cbl')
    writeFileSync(path, SAMPLE)
    const result = extractFlow(path)
    const init = result.paragraphs.find((p) => p.name === 'INIT-PARA')!
    expect(init.calls).toEqual(['DBACCESS', 'LOGGER'])
  })

  it('does not confuse DIVISION or SECTION headers as paragraphs', () => {
    const path = join(TMP, 'PAYROLL.cbl')
    writeFileSync(path, SAMPLE)
    const result = extractFlow(path)
    const names = result.paragraphs.map((p) => p.name)
    expect(names).not.toContain('PROCEDURE')
    expect(names).not.toContain('DATA')
    expect(names).not.toContain('WORKING-STORAGE')
  })
})
