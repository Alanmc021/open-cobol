import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { resolve, basename, extname, join } from 'node:path'
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { analyzeFile, extractFlow, parseDataDivisionFromSource } from '@opencobol/parser-core'
import {
  generateFlowDiagram,
  generateCallsDiagram,
  generateDataDiagram,
  generateArchDiagram,
} from '@opencobol/ai-runtime'

const BRAND = chalk.bold.hex('#00D4FF')
const DIM = chalk.dim
const SUCCESS = chalk.green
const ERROR = chalk.red

type DiagramType = 'flow' | 'calls' | 'data' | 'arch' | 'all'

const TYPE_LABELS: Record<DiagramType, string> = {
  flow: 'Execution Flow',
  calls: 'Call Graph',
  data: 'Data Structures',
  arch: 'Architecture Overview (AI)',
  all: 'All Diagrams',
}

export const diagramCommand = new Command('diagram')
  .description('Generate Mermaid diagrams for a COBOL program (flow, calls, data, arch)')
  .argument('<file>', 'COBOL file to diagram')
  .option('--type <type>', 'Diagram type: flow | calls | data | arch | all', 'all')
  .option('--output <dir>', 'Save diagram(s) to a directory (prints to stdout if omitted)')
  .option('--model <model>', 'OpenAI model for --type arch', 'gpt-4o')
  .action(
    async (
      filePath: string,
      options: { type: string; output?: string; model: string },
    ) => {
      const resolvedPath = resolve(filePath.replace(/^~/, process.env['HOME'] ?? '~'))

      if (!existsSync(resolvedPath)) {
        console.error(ERROR(`\n  File not found: ${resolvedPath}\n`))
        process.exit(1)
      }

      const type = options.type as DiagramType
      const validTypes: DiagramType[] = ['flow', 'calls', 'data', 'arch', 'all']
      if (!validTypes.includes(type)) {
        console.error(ERROR(`\n  Invalid type "${type}". Use: flow | calls | data | arch | all\n`))
        process.exit(1)
      }

      const programName = basename(resolvedPath, extname(resolvedPath)).toUpperCase()

      console.log()
      console.log(BRAND('  ██████  OpenCobol AI — Diagram'))
      console.log(DIM('  ──────────────────────────────────────'))
      console.log(`  ${chalk.bold.white('Program')}  ${chalk.cyan(programName)}`)
      console.log(`  ${chalk.bold.white('Type')}     ${chalk.cyan(TYPE_LABELS[type])}`)
      if (options.output) {
        console.log(`  ${chalk.bold.white('Output')}   ${chalk.cyan(options.output)}`)
      }
      console.log()

      // Parse the file once — everything else uses these results
      const spinner = ora({ text: 'Parsing COBOL…', color: 'cyan' }).start()

      let cobolFile
      let flow = null
      let source = ''
      let wsFields: ReturnType<typeof parseDataDivisionFromSource>['workingStorage'] = []

      try {
        cobolFile = analyzeFile(resolvedPath)
        source = readFileSync(resolvedPath, 'utf-8')

        const dataDivision = parseDataDivisionFromSource(source)
        wsFields = dataDivision.workingStorage

        try {
          flow = extractFlow(resolvedPath)
        } catch {
          // best-effort
        }

        spinner.succeed('COBOL parsed')
      } catch (err) {
        spinner.fail(`Parse failed: ${(err as Error).message}`)
        process.exit(1)
      }

      const progId = cobolFile.programId ?? programName
      const results: Array<{ type: DiagramType; content: string }> = []
      const toGenerate: DiagramType[] =
        type === 'all' ? ['flow', 'calls', 'data', 'arch'] : [type]

      for (const t of toGenerate) {
        const label = TYPE_LABELS[t]!
        const s = ora({ text: `Generating ${label}…`, color: 'cyan' }).start()

        try {
          let content: string

          if (t === 'flow') {
            if (!flow) { s.warn('Flow extraction failed — skipping'); continue }
            content = generateFlowDiagram(flow)
          } else if (t === 'calls') {
            content = generateCallsDiagram(cobolFile)
          } else if (t === 'data') {
            content = generateDataDiagram(progId, wsFields)
          } else {
            content = await generateArchDiagram(cobolFile, source, flow, { model: options.model })
          }

          s.succeed(label)
          results.push({ type: t, content })
        } catch (err) {
          s.fail(`${label} failed: ${(err as Error).message}`)
        }
      }

      if (results.length === 0) {
        console.log(ERROR('\n  No diagrams generated.\n'))
        process.exit(1)
      }

      if (options.output) {
        mkdirSync(resolve(options.output), { recursive: true })

        if (type === 'all') {
          const combined = results.map((r) => r.content).join('\n---\n\n')
          const outPath = join(resolve(options.output), `${progId}-diagrams.md`)
          writeFileSync(outPath, combined, 'utf-8')
          console.log()
          console.log(SUCCESS(`  ✔ Written to ${outPath}`))
        } else {
          const outPath = join(resolve(options.output), `${progId}-${type}.md`)
          writeFileSync(outPath, results[0]!.content, 'utf-8')
          console.log()
          console.log(SUCCESS(`  ✔ Written to ${outPath}`))
        }
      } else {
        console.log()
        for (const r of results) {
          console.log(r.content)
          if (results.length > 1) console.log(DIM('─'.repeat(60)) + '\n')
        }
      }
    },
  )
