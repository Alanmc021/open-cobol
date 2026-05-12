import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { resolve } from 'node:path'
import { analyzeFile } from '@opencobol/parser-core'
import { explainFile } from '@opencobol/ai-runtime'

const BRAND = chalk.bold.hex('#00D4FF')
const DIM = chalk.dim
const LABEL = chalk.bold.white
const FILE_COLOR = chalk.cyan
const WARN = chalk.yellow

function renderExplainHeader(filePath: string): void {
  const file = analyzeFile(filePath)

  console.log()
  console.log(BRAND('  ██████  OpenCobol AI — Explain'))
  console.log(DIM('  ─────────────────────────────────────'))
  console.log()
  console.log(`  ${LABEL('Program')}    ${BRAND(file.programId ?? file.name.replace(/\.[^.]+$/, ''))}`)
  console.log(`  ${LABEL('File')}       ${FILE_COLOR(file.name)}`)
  console.log(`  ${LABEL('Lines')}      ${file.lines}`)

  if (file.copybooks.length > 0) {
    console.log(`  ${LABEL('Copybooks')}  ${file.copybooks.map((c) => WARN(c)).join(', ')}`)
  }
  if (file.calls.length > 0) {
    console.log(`  ${LABEL('Calls')}      ${file.calls.map((c) => chalk.magenta(c)).join(', ')}`)
  }

  console.log()
  console.log(DIM('  ─────────────────────────────────────'))
  console.log()
}

export const explainCommand = new Command('explain')
  .description('Explain the business logic of a COBOL program using AI')
  .argument('<file>', 'Path to the COBOL file')
  .option('--model <model>', 'OpenAI model to use', 'gpt-4o')
  .option('--raw', 'Output raw markdown without header')
  .action(async (filePath: string, options: { model: string; raw?: boolean }) => {
    const resolvedPath = resolve(filePath)

    if (!options.raw) {
      renderExplainHeader(resolvedPath)
    }

    const spinner = ora({ text: 'Connecting to AI…', color: 'cyan' }).start()
    let firstChunk = true

    try {
      for await (const text of explainFile({
        filePath: resolvedPath,
        options: { model: options.model },
      })) {
        if (firstChunk) {
          spinner.stop()
          firstChunk = false
        }
        process.stdout.write(
          options.raw ? text : applyMarkdownColors(text),
        )
      }
      console.log()
      console.log()
    } catch (err) {
      spinner.fail(`Explain failed: ${(err as Error).message}`)
      process.exitCode = 1
    }
  })

// Minimal inline markdown highlighting for terminal output
function applyMarkdownColors(text: string): string {
  return text
    .replace(/^(#{1,3} .+)$/gm, (m) => chalk.bold.white(m))
    .replace(/\*\*(.+?)\*\*/g, (_, t) => chalk.bold(t))
    .replace(/`(.+?)`/g, (_, t) => chalk.cyan(t))
}
