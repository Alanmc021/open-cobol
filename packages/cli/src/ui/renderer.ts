import chalk from 'chalk'
import type { ScanResult, CopybookDependency, CallDependency } from '@opencobol/shared'
import { buildCopybookDependencies, buildCallDependencies } from '@opencobol/parser-core'

const BRAND = chalk.bold.hex('#00D4FF')
const DIM = chalk.dim
const SUCCESS = chalk.green
const WARN = chalk.yellow
const FILE_COLOR = chalk.cyan
const LABEL = chalk.bold.white

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatMs(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`
}

function pad(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len - 1) + '…' : str.padEnd(len)
}

function row(cols: string[], widths: number[]): string {
  return '  │ ' + cols.map((c, i) => pad(c, widths[i] ?? 10)).join('  │  ') + '  │'
}

function divider(widths: number[], char = '─'): string {
  return '  ├─' + widths.map((w) => char.repeat(w + 2)).join('─┼─') + '─┤'
}

function topBorder(widths: number[]): string {
  return '  ┌─' + widths.map((w) => '─'.repeat(w + 2)).join('─┬─') + '─┐'
}

function bottomBorder(widths: number[]): string {
  return '  └─' + widths.map((w) => '─'.repeat(w + 2)).join('─┴─') + '─┘'
}

export function renderScanResult(result: ScanResult): void {
  const { files, stats, durationMs, rootPath } = result

  console.log()
  console.log(BRAND('  ██████  OpenCobol AI'))
  console.log(DIM('  ─────────────────────────────────────'))
  console.log()

  console.log(`  ${LABEL('Path')}      ${FILE_COLOR(rootPath)}`)
  console.log(
    `  ${LABEL('Files')}     ${SUCCESS(String(stats.programs))} programs  +  ${WARN(String(stats.copybooks))} copybooks`,
  )
  console.log(
    `  ${LABEL('Lines')}     ${stats.totalLines.toLocaleString()}  ${DIM('·')}  ${LABEL('Size')} ${formatBytes(stats.totalSizeBytes)}`,
  )
  console.log(`  ${LABEL('Duration')}  ${formatMs(durationMs)}`)
  console.log()

  if (files.length === 0) {
    console.log(DIM('  No COBOL files found.'))
    return
  }

  // --- File table ---
  const COL_WIDTHS = [28, 10, 6, 12, 8]
  const headers = ['File', 'Type', 'Lines', 'Copybooks', 'Calls']

  console.log(DIM(topBorder(COL_WIDTHS)))
  console.log(
    DIM('  │ ') +
      headers
        .map((h, i) => chalk.bold(pad(h, COL_WIDTHS[i] ?? 10)))
        .join(DIM('  │  ')) +
      DIM('  │'),
  )
  console.log(DIM(divider(COL_WIDTHS)))

  for (const f of files) {
    const typeColor = f.type === 'program' ? SUCCESS : f.type === 'copybook' ? WARN : DIM
    const cols = [
      FILE_COLOR(f.name),
      typeColor(f.type),
      String(f.lines),
      f.copybooks.length > 0 ? f.copybooks.join(', ') : DIM('—'),
      f.calls.length > 0 ? String(f.calls.length) : DIM('—'),
    ]
    console.log(row(cols, COL_WIDTHS))
  }

  console.log(DIM(bottomBorder(COL_WIDTHS)))
  console.log()

  // --- Copybook dependencies ---
  const copybookDeps: CopybookDependency[] = buildCopybookDependencies(files)
  if (copybookDeps.length > 0) {
    console.log(LABEL('  Copybook Dependencies'))
    console.log(DIM('  ─────────────────────'))
    for (const dep of copybookDeps) {
      console.log(
        `  ${WARN(pad(dep.copybook, 20))}  ${DIM('←')}  ${dep.usedBy.map((f) => FILE_COLOR(f)).join(', ')}`,
      )
    }
    console.log()
  }

  // --- External calls ---
  const callDeps: CallDependency[] = buildCallDependencies(files)
  const externalCalls = callDeps.filter(
    (c) => !files.some((f) => f.programId === c.target || f.name.replace(/\.[^.]+$/, '') === c.target),
  )
  if (externalCalls.length > 0) {
    console.log(LABEL('  External Calls'))
    console.log(DIM('  ───────────────'))
    for (const dep of externalCalls) {
      const callers = dep.calledBy
        .map((c) => `${FILE_COLOR(c.file)}${DIM(`(${c.count}×)`)}`)
        .join(', ')
      console.log(`  ${chalk.magenta(pad(dep.target, 20))}  ${DIM('←')}  ${callers}`)
    }
    console.log()
  }
}
