import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { parseDataDivision, parseDataDivisionFromSource } from '../data-division.js'

const FIXTURES = resolve('/Users/alan.cruz/Documents/openCobol/examples/legacy')

describe('parseDataDivisionFromSource', () => {
  it('parses WORKING-STORAGE fields with PIC and COMP-3', () => {
    const source = `
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-AMOUNT         PIC S9(10)V99 COMP-3.
       01 WS-NAME           PIC X(40).
       01 WS-CODE           PIC 9(4).
       PROCEDURE DIVISION.
           STOP RUN.
`
    const result = parseDataDivisionFromSource(source)
    expect(result.workingStorage).toHaveLength(3)

    const amount = result.workingStorage[0]!
    expect(amount.level).toBe(1)
    expect(amount.name).toBe('WS-AMOUNT')
    expect(amount.pic).toBe('S9(10)V99')
    expect(amount.usage).toBe('COMP-3')
    expect(amount.section).toBe('WORKING-STORAGE')

    const name = result.workingStorage[1]!
    expect(name.pic).toBe('X(40)')
    expect(name.usage).toBeNull()

    const code = result.workingStorage[2]!
    expect(code.pic).toBe('9(4)')
  })

  it('parses level-88 condition names with VALUE', () => {
    const source = `
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-STATUS            PIC X(1).
          88 STATUS-ACTIVE     VALUE 'A'.
          88 STATUS-INACTIVE   VALUE 'I'.
       PROCEDURE DIVISION.
           STOP RUN.
`
    const result = parseDataDivisionFromSource(source)
    expect(result.workingStorage).toHaveLength(3)

    const active = result.workingStorage[1]!
    expect(active.level).toBe(88)
    expect(active.name).toBe('STATUS-ACTIVE')
    expect(active.pic).toBeNull()
    expect(active.value).toBe("'A'")

    const inactive = result.workingStorage[2]!
    expect(inactive.name).toBe('STATUS-INACTIVE')
    expect(inactive.value).toBe("'I'")
  })

  it('separates WORKING-STORAGE from LINKAGE SECTION', () => {
    const source = `
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-INTERNAL        PIC X(10).
       LINKAGE SECTION.
       01 LS-PARAM           PIC 9(8).
       PROCEDURE DIVISION.
           STOP RUN.
`
    const result = parseDataDivisionFromSource(source)
    expect(result.workingStorage).toHaveLength(1)
    expect(result.workingStorage[0]!.name).toBe('WS-INTERNAL')
    expect(result.linkage).toHaveLength(1)
    expect(result.linkage[0]!.name).toBe('LS-PARAM')
    expect(result.linkage[0]!.section).toBe('LINKAGE')
  })

  it('stops parsing at PROCEDURE DIVISION', () => {
    const source = `
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-OK              PIC X.
       PROCEDURE DIVISION.
       01 THIS-SHOULD-NOT-APPEAR PIC 9.
`
    const result = parseDataDivisionFromSource(source)
    expect(result.fields).toHaveLength(1)
    expect(result.fields[0]!.name).toBe('WS-OK')
  })

  it('ignores lines before DATA DIVISION', () => {
    const source = `
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST.
       01 GHOST-FIELD PIC X.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-REAL           PIC 9(4).
       PROCEDURE DIVISION.
`
    const result = parseDataDivisionFromSource(source)
    expect(result.fields).toHaveLength(1)
    expect(result.fields[0]!.name).toBe('WS-REAL')
  })
})

describe('parseDataDivision — fixture files', () => {
  it('parses PAYROLL.cbl fields correctly', () => {
    const result = parseDataDivision(resolve(FIXTURES, 'PAYROLL.cbl'))
    const names = result.workingStorage.map((f) => f.name)

    expect(names).toContain('WS-EMPLOYEE-ID')
    expect(names).toContain('WS-HOURS-WORKED')
    expect(names).toContain('WS-GROSS-PAY')
    expect(names).toContain('WS-NET-PAY')
    expect(names).toContain('WS-TAX-AMOUNT')

    const gross = result.workingStorage.find((f) => f.name === 'WS-GROSS-PAY')!
    expect(gross.pic).toBe('S9(10)V99')
    expect(gross.usage).toBe('COMP-3')
  })

  it('parses CUSTOMER.cbl fields correctly', () => {
    const result = parseDataDivision(resolve(FIXTURES, 'CUSTOMER.cbl'))
    const names = result.workingStorage.map((f) => f.name)

    expect(names).toContain('WS-CUSTOMER-ID')
    expect(names).toContain('WS-CUSTOMER-NAME')
    expect(names).toContain('WS-ACCOUNT-BALANCE')
    expect(names).toContain('WS-STATUS')
    expect(names).toContain('STATUS-ACTIVE')
    expect(names).toContain('STATUS-INACTIVE')

    const balance = result.workingStorage.find((f) => f.name === 'WS-ACCOUNT-BALANCE')!
    expect(balance.pic).toBe('S9(12)V99')
    expect(balance.usage).toBe('COMP-3')
  })

  it('parses INVENTORY.cbl fields correctly', () => {
    const result = parseDataDivision(resolve(FIXTURES, 'INVENTORY.cbl'))
    const names = result.workingStorage.map((f) => f.name)

    expect(names).toContain('WS-ITEM-CODE')
    expect(names).toContain('WS-QUANTITY')
    expect(names).toContain('WS-REORDER-LEVEL')

    const itemCode = result.workingStorage.find((f) => f.name === 'WS-ITEM-CODE')!
    expect(itemCode.pic).toBe('X(12)')
  })

  it('returns empty dataDivision for program with no fields', () => {
    const result = parseDataDivisionFromSource(`
       IDENTIFICATION DIVISION.
       PROGRAM-ID. EMPTY.
       PROCEDURE DIVISION.
           STOP RUN.
`)
    expect(result.fields).toHaveLength(0)
    expect(result.workingStorage).toHaveLength(0)
  })
})
