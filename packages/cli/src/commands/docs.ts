import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { resolve, basename, extname } from 'node:path'
import { writeFileSync } from 'node:fs'
import { runDocsAgent } from '@opencobol/ai-runtime'

const BRAND = chalk.bold.hex('#00D4FF')
const DIM = chalk.dim
const SUCCESS = chalk.green
const AI_COLOR = chalk.white

function applyMarkdownColors(text: string): string {
  return text
    .replace(/^(#{1,3} .+)$/gm, (m) => chalk.bold.white(m))
    .replace(/\*\*(.+?)\*\*/g, (_, t) => chalk.bold(t))
    .replace(/`(.+?)`/g, (_, t) => chalk.cyan(t))
    .replace(/\|(.+)\|/g, (m) => chalk.dim(m))
}

export const docsCommand = new Command('docs')
  .description('Generate markdown documentation for a COBOL program')
  .argument('<file>', 'COBOL file to document')
  .option('--model <model>', 'OpenAI model', 'gpt-4o')
  .option('--output <file>', 'Save documentation to a file (default: <program>.md)')
  .action(async (filePath: string, options: { model: string; output?: string }) => {
    const resolvedPath = resolve(filePath)
    const programName = basename(filePath, extname(filePath)).toUpperCase()
    const defaultOutput = `${basename(filePath, extname(filePath))}.md`

    console.log()
    console.log(BRAND('  ██████  OpenCobol AI — Generate Docs'))
    console.log(DIM('  ─────────────────────────────────────'))
    console.log()
    console.log(`  ${chalk.bold.white('Program')}   ${chalk.cyan(programName)}`)
    console.log()

    const spinner = ora({ text: 'Generating documentation…', color: 'cyan' }).start()

    const { documentation, error } = await runDocsAgent(resolvedPath, { model: options.model })

    spinner.stop()

    if (error) {
      console.error(chalk.red(`  Error: ${error}`))
      process.exitCode = 1
      return
    }

    const content = documentation ?? ''
    const outputPath = options.output ?? defaultOutput

    writeFileSync(resolve(outputPath), content, 'utf-8')
    console.log(SUCCESS(`  Documentation saved to ${outputPath}`))
    console.log()

    // Also print a preview
    const preview = content.split('\n').slice(0, 20).join('\n')
    console.log(DIM('  Preview:'))
    console.log(DIM('  ─────────────────────────────────────'))
    for (const line of preview.split('\n')) {
      console.log('  ' + AI_COLOR(applyMarkdownColors(line)))
    }
    if (content.split('\n').length > 20) {
      console.log(DIM(`  … (${content.split('\n').length - 20} more lines in ${outputPath})`))
    }
    console.log()
  })
