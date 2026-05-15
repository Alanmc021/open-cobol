import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { resolve, basename, extname } from 'node:path'
import { existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { setMaxListeners } from 'node:events'
import { streamCodeAgent, NODE_LABELS } from '@opencobol/ai-runtime'

// LangGraph creates many AbortSignal listeners per LLM call — raise the limit globally
setMaxListeners(50)

const BRAND = chalk.bold.hex('#00D4FF')
const DIM = chalk.dim
const SUCCESS = chalk.green
const WARN = chalk.yellow
const ERROR = chalk.red
const PROMPT_CHAR = chalk.bold.hex('#00D4FF')('▶')

interface SessionOptions {
  lang: string
  output: string
  model: string
  auto: boolean
  validate: boolean
  maxRetries: number
  collection: string
  qdrant: string
}

function confirmWriteFiles(files: string[]): Promise<boolean> {
  return new Promise((res) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    console.log()
    console.log(DIM('  Files to be written:'))
    for (const f of files) console.log(`  ${chalk.cyan('+')} ${f}`)
    rl.question(`\n  Proceed with writing files? [y/N] `, (answer) => {
      rl.close()
      res(answer.trim().toLowerCase() === 'y')
    })
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentState = Record<string, any>

async function runAgent(filePath: string, opts: SessionOptions): Promise<void> {
  const resolvedPath = resolve(filePath.replace(/^~/, process.env['HOME'] ?? '~'))

  if (!existsSync(resolvedPath)) {
    console.log(ERROR(`\n  File not found: ${resolvedPath}\n`))
    return
  }

  const programName = basename(resolvedPath, extname(resolvedPath)).toUpperCase()

  console.log()
  console.log(DIM('  ─────────────────────────────────────────'))
  console.log(`  ${chalk.bold.white('Program')}    ${chalk.cyan(programName)}`)
  console.log(`  ${chalk.bold.white('Target')}     ${chalk.cyan(opts.lang)}`)
  console.log(`  ${chalk.bold.white('Output')}     ${chalk.cyan(opts.output)}`)
  console.log(`  ${chalk.bold.white('Validate')}   ${opts.validate ? chalk.green('yes') : DIM('no')}`)
  console.log()

  const spinner = ora({ color: 'cyan' }).start('Starting agent…')
  let currentIteration = 0
  let mergedState: AgentState = {}
  let aborted = false

  try {
    const stream = streamCodeAgent({
      filePath: resolvedPath,
      targetLanguage: opts.lang as 'typescript' | 'java' | 'python' | 'go' | 'cobol',
      outputDir: opts.output,
      options: {
        model: opts.model,
        maxRetries: opts.maxRetries,
        autoApprove: opts.auto,
        validate: opts.validate,
        collection: opts.collection,
        qdrantUrl: opts.qdrant,
      },
    })

    for await (const { node, state } of stream) {
      // streamMode: 'updates' returns deltas — merge into full state
      mergedState = { ...mergedState, ...(state as AgentState) }

      if (node === 'fix-code') {
        currentIteration++
        spinner.text = `${WARN('Fixing errors…')} (attempt ${currentIteration}/${opts.maxRetries})`
        continue
      }

      if (node === 'validate' && currentIteration > 0) {
        const v = (state as AgentState).validationResult as { passed: boolean; failCount: number } | undefined
        if (v && !v.passed) {
          spinner.text = `${WARN('Validation failed')} — ${v.failCount} error(s), retrying…`
          continue
        }
      }

      if (node === '__interrupt__') {
        spinner.stop()
        const sourceFiles = (mergedState.sourceFiles ?? []) as { path: string }[]
        const files = sourceFiles.map((f) => f.path)
        const approved = await confirmWriteFiles(files)
        if (!approved) {
          console.log(ERROR('\n  Aborted. No files written.\n'))
          aborted = true
          break
        }
        spinner.start('Writing files…')
        continue
      }

      spinner.text = NODE_LABELS[node] ?? node
    }

    spinner.stop()

    if (aborted || !Object.keys(mergedState).length) return

    console.log()
    console.log(SUCCESS(`  ✔ ${programName} modernized`))
    console.log()

    const businessRules = (mergedState.businessRules ?? []) as { name: string; id: string }[]
    if (businessRules.length > 0) {
      console.log(`  ${chalk.bold.white('Business rules:')} ${chalk.cyan(businessRules.length)}`)
      for (const r of businessRules) {
        console.log(`    ${DIM('•')} ${r.name} ${DIM(`(${r.id})`)}`)
      }
      console.log()
    }

    const writtenPaths = (mergedState.writtenPaths ?? []) as string[]
    if (writtenPaths.length > 0) {
      console.log(`  ${chalk.bold.white('Files written:')}`)
      for (const p of writtenPaths) {
        console.log(`    ${chalk.green('+')} ${p}`)
      }
      console.log()
    }

    const vr = mergedState.validationResult as { passed: boolean; passCount: number; testCount: number; errors: string[] } | undefined
    if (vr) {
      const icon = vr.passed ? SUCCESS('✔') : WARN('⚠')
      console.log(`  ${icon} ${chalk.bold.white('Tests:')} ${vr.passCount}/${vr.testCount} passed`)
      if (!vr.passed && vr.errors.length > 0) {
        console.log()
        console.log(WARN('  Failures:'))
        for (const err of vr.errors.slice(0, 5)) {
          console.log(`    ${DIM('•')} ${err}`)
        }
      }
      console.log()
    }

    if (mergedState.error) {
      console.log(ERROR(`  Error: ${mergedState.error as string}\n`))
    } else {
      console.log(DIM(`  Migration notes → ${opts.output}/MIGRATION_NOTES.md`))
      console.log()
    }
  } catch (err) {
    spinner.stop()
    console.error(ERROR(`\n  Fatal error: ${(err as Error).message}\n`))
  }
}

function printHelp(): void {
  console.log()
  console.log(DIM('  Paste a .cbl file path to modernize it. Or:'))
  console.log()
  console.log(`    ${chalk.cyan('/set lang')}       <typescript|java|python|go>`)
  console.log(`    ${chalk.cyan('/set output')}     <dir>`)
  console.log(`    ${chalk.cyan('/set model')}      <gpt-4o|gpt-4o-mini>`)
  console.log(`    ${chalk.cyan('/set collection')} <name>`)
  console.log(`    ${chalk.cyan('/set auto')}       toggle auto-approve`)
  console.log(`    ${chalk.cyan('/set validate')}   <true|false>`)
  console.log(`    ${chalk.cyan('/settings')}       show current settings`)
  console.log(`    ${chalk.cyan('/exit')}           quit`)
  console.log()
}

function printSettings(opts: SessionOptions): void {
  console.log()
  console.log(`  ${chalk.bold.white('lang')}       ${chalk.cyan(opts.lang)}`)
  console.log(`  ${chalk.bold.white('model')}      ${chalk.cyan(opts.model)}`)
  console.log(`  ${chalk.bold.white('output')}     ${chalk.cyan(opts.output)}`)
  console.log(`  ${chalk.bold.white('collection')} ${chalk.cyan(opts.collection)}`)
  console.log(`  ${chalk.bold.white('auto')}       ${opts.auto ? chalk.green('yes') : DIM('no')}`)
  console.log(`  ${chalk.bold.white('validate')}   ${opts.validate ? chalk.green('yes') : DIM('no')}`)
  console.log(`  ${chalk.bold.white('retries')}    ${chalk.cyan(opts.maxRetries)}`)
  console.log()
}

export const agentCommand = new Command('agent')
  .description('Autonomously modernize a COBOL program with AI (analyze → generate → validate → write)')
  .argument('[file]', 'COBOL file to modernize (omit to start interactive session)')
  .option('--lang <language>', 'Target language: typescript, java, python, go', 'typescript')
  .option('--output <dir>', 'Output directory', './generated')
  .option('--model <model>', 'OpenAI model', 'gpt-4o')
  .option('--auto', 'Auto-approve file writes (skip confirmation)', false)
  .option('--no-validate', 'Skip running generated tests')
  .option('--max-retries <n>', 'Max fix iterations if tests fail', '3')
  .option('--collection <name>', 'Qdrant collection to use for RAG context', 'opencobol')
  .option('--qdrant <url>', 'Qdrant URL', 'http://localhost:6333')
  .action(async (filePath: string | undefined, rawOptions: {
    lang: string; output: string; model: string; auto: boolean
    validate: boolean; maxRetries: string; collection: string; qdrant: string
  }) => {
    const opts: SessionOptions = {
      lang: rawOptions.lang,
      output: rawOptions.output,
      model: rawOptions.model,
      auto: rawOptions.auto,
      validate: rawOptions.validate,
      maxRetries: parseInt(rawOptions.maxRetries, 10),
      collection: rawOptions.collection,
      qdrant: rawOptions.qdrant,
    }

    // One-shot mode: file provided as argument
    if (filePath) {
      console.log()
      console.log(BRAND('  ██████  OpenCobol AI — Agent'))
      await runAgent(filePath, opts)
      return
    }

    // Interactive REPL mode
    console.log()
    console.log(BRAND('  ██████  OpenCobol AI — Agent'))
    console.log(DIM('  Paste a .cbl file path to modernize it. Type /help for commands.'))
    console.log(DIM('  Ctrl+C to exit.'))
    console.log()
    console.log(`  ${chalk.bold.white('lang')} ${chalk.cyan(opts.lang)}  ${chalk.bold.white('model')} ${chalk.cyan(opts.model)}  ${chalk.bold.white('output')} ${chalk.cyan(opts.output)}`)
    console.log()

    const rl = createInterface({ input: process.stdin, output: process.stdout })

    rl.on('close', () => {
      console.log(DIM('\n  Bye!\n'))
      process.exit(0)
    })

    const loop = (): void => {
      rl.question(`  ${PROMPT_CHAR} `, async (input) => {
        const trimmed = input.trim()

        if (!trimmed) { loop(); return }

        if (trimmed === '/exit' || trimmed === '/quit') {
          rl.close()
          return
        }

        if (trimmed === '/help') {
          printHelp()
          loop()
          return
        }

        if (trimmed === '/settings') {
          printSettings(opts)
          loop()
          return
        }

        if (trimmed.startsWith('/set ')) {
          const rest = trimmed.slice(5).trim()
          const spaceIdx = rest.indexOf(' ')
          const key = spaceIdx === -1 ? rest : rest.slice(0, spaceIdx)
          const val = spaceIdx === -1 ? '' : rest.slice(spaceIdx + 1).trim()

          switch (key) {
            case 'lang':       opts.lang = val; break
            case 'output':     opts.output = val; break
            case 'model':      opts.model = val; break
            case 'collection': opts.collection = val; break
            case 'auto':       opts.auto = !opts.auto; break
            case 'validate':   opts.validate = val !== 'false'; break
            case 'retries':    opts.maxRetries = parseInt(val, 10) || opts.maxRetries; break
            default:
              console.log(WARN(`  Unknown setting: ${key}. Type /help to see options.\n`))
              loop()
              return
          }
          console.log(SUCCESS(`  ✔ ${key} = ${key === 'auto' ? (opts.auto ? 'yes' : 'no') : (val || '(toggled)')}`))
          console.log()
          loop()
          return
        }

        // Detect file path by extension or path prefix
        if (/\.(cbl|cob)$/i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('~/') || trimmed.startsWith('../')) {
          await runAgent(trimmed, opts)
          loop()
          return
        }

        console.log(WARN(`  Unknown command. Type /help or paste a .cbl file path.\n`))
        loop()
      })
    }

    loop()
  })
