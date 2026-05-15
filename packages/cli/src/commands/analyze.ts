import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { runOrchestratorAgent } from '@opencobol/ai-runtime'

const BRAND = chalk.bold.hex('#00D4FF')
const DIM = chalk.dim
const OK = chalk.green('✔')
const FAIL = chalk.red('✘')

export const analyzeCommand = new Command('analyze')
  .description('Run full AI analysis on a COBOL codebase and generate a report')
  .argument('[path]', 'Root directory containing COBOL files (default: current directory)')
  .option('--model <model>', 'OpenAI model to use', 'gpt-4o')
  .option('--output <file>', 'Output file for the report', 'opencobol-report.md')
  .action(async (dirPath: string | undefined, options: { model: string; output: string }) => {
    const rootPath = resolve(dirPath ?? '.')
    const outputFile = resolve(options.output)

    console.log()
    console.log(BRAND('  ██████  OpenCobol AI — Analyze'))
    console.log(DIM('  ─────────────────────────────────────'))
    console.log()
    console.log(`  ${chalk.bold('Directory')}  ${chalk.cyan(rootPath)}`)
    console.log(`  ${chalk.bold('Model')}      ${chalk.cyan(options.model)}`)
    console.log(`  ${chalk.bold('Output')}     ${chalk.cyan(outputFile)}`)
    console.log()

    const phases = [
      { key: 'scan', label: 'Scanning COBOL files…' },
      { key: 'dependency', label: 'Analyzing dependencies…' },
      { key: 'explain', label: 'Explaining programs with AI…' },
      { key: 'docs', label: 'Assembling report…' },
    ]

    let phaseIndex = 0
    const spinner = ora({ text: phases[0]!.label, color: 'cyan' }).start()

    const advancePhase = () => {
      phaseIndex++
      if (phaseIndex < phases.length) {
        spinner.text = phases[phaseIndex]!.label
      }
    }

    // Intercept console to advance spinner between phases (best-effort timing)
    const originalLog = console.log
    let callCount = 0
    console.log = (...args) => {
      callCount++
      if (callCount % 3 === 0) advancePhase()
      originalLog(...args)
    }

    try {
      const { finalReport, error } = await runOrchestratorAgent(rootPath, {
        model: options.model,
      })

      console.log = originalLog

      if (error || !finalReport) {
        spinner.fail(`${FAIL} Analysis failed: ${error ?? 'no output generated'}`)
        process.exitCode = 1
        return
      }

      spinner.succeed(`${OK} Analysis complete`)
      console.log()

      writeFileSync(outputFile, finalReport, 'utf-8')

      const lineCount = finalReport.split('\n').length
      console.log(`  ${chalk.bold('Report')}     ${chalk.green(outputFile)}`)
      console.log(`  ${chalk.bold('Lines')}      ${lineCount}`)
      console.log()
      console.log(DIM('  ─────────────────────────────────────'))
      console.log()
    } catch (err) {
      console.log = originalLog
      spinner.fail(`${FAIL} Analysis failed: ${(err as Error).message}`)
      process.exitCode = 1
    }
  })
