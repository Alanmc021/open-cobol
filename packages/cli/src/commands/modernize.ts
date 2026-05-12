import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { resolve, basename, extname } from 'node:path'
import { writeFileSync } from 'node:fs'
import { runModernizationAgent } from '@opencobol/ai-runtime'

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

export const modernizeCommand = new Command('modernize')
  .description('Generate a modernization plan for a COBOL program')
  .argument('<file>', 'COBOL file to modernize')
  .option('--lang <language>', 'Target language (typescript, java, python, go)', 'typescript')
  .option('--model <model>', 'OpenAI model', 'gpt-4o')
  .option('--output <file>', 'Save plan to a markdown file')
  .action(async (filePath: string, options: { lang: string; model: string; output?: string }) => {
    const resolvedPath = resolve(filePath)
    const programName = basename(filePath, extname(filePath)).toUpperCase()

    console.log()
    console.log(BRAND('  ██████  OpenCobol AI — Modernize'))
    console.log(DIM('  ─────────────────────────────────────'))
    console.log()
    console.log(`  ${chalk.bold.white('Program')}   ${chalk.cyan(programName)}`)
    console.log(`  ${chalk.bold.white('Target')}    ${chalk.cyan(options.lang)}`)
    console.log()

    const spinner = ora({ text: 'Analyzing program…', color: 'cyan' }).start()

    const { plan, error } = await runModernizationAgent(resolvedPath, options.lang, {
      model: options.model,
    })

    spinner.stop()

    if (error) {
      console.error(chalk.red(`  Error: ${error}`))
      process.exitCode = 1
      return
    }

    const content = plan ?? ''

    if (options.output) {
      writeFileSync(resolve(options.output), content, 'utf-8')
      console.log(SUCCESS(`  Plan saved to ${options.output}`))
      console.log()
      return
    }

    console.log(chalk.dim('  ─────────────────────────────────────'))
    console.log()
    for (const line of content.split('\n')) {
      console.log('  ' + AI_COLOR(applyMarkdownColors(line)))
    }
    console.log()
    console.log(DIM(`  Tip: use --output plan.md to save as a markdown file.`))
    console.log()
  })
