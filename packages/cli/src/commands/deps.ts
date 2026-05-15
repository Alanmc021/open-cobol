import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { resolve } from 'node:path'
import { runDependencyAgent } from '@opencobol/ai-runtime'

const BRAND = chalk.bold.hex('#00D4FF')
const DIM = chalk.dim
const AI_COLOR = chalk.white

function applyMarkdownColors(text: string): string {
  return text
    .replace(/^(#{1,3} .+)$/gm, (m) => chalk.bold.white(m))
    .replace(/\*\*(.+?)\*\*/g, (_, t) => chalk.bold(t))
    .replace(/`(.+?)`/g, (_, t) => chalk.cyan(t))
    .replace(/\|(.+)\|/g, (m) => chalk.dim(m))
}

export const depsCommand = new Command('deps')
  .description('Analyze inter-program dependencies and produce a migration impact report')
  .argument('[path]', 'Directory to scan (default: current directory)')
  .option('--program <name>', 'Focus on impact of changing a specific program')
  .option('--model <model>', 'OpenAI model', 'gpt-4o')
  .action(async (targetPath: string | undefined, options: { program?: string; model: string }) => {
    const resolvedPath = resolve(targetPath ?? '.')

    console.log()
    console.log(BRAND('  ██████  OpenCobol AI — Dependency Analysis'))
    console.log(DIM('  ─────────────────────────────────────'))
    console.log()

    if (options.program) {
      console.log(`  ${chalk.bold.white('Focus')}  ${chalk.cyan(options.program)}`)
      console.log()
    }

    const spinner = ora({ text: 'Scanning codebase…', color: 'cyan' }).start()

    const { report, error } = await runDependencyAgent(resolvedPath, options.program, {
      model: options.model,
    })

    spinner.stop()

    if (error) {
      console.error(chalk.red(`  Error: ${error}`))
      process.exitCode = 1
      return
    }

    console.log(chalk.dim('  ─────────────────────────────────────'))
    console.log()
    for (const line of (report ?? '').split('\n')) {
      console.log('  ' + AI_COLOR(applyMarkdownColors(line)))
    }
    console.log()
  })
