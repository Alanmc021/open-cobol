import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { resolve, basename, extname, join } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { runApiGeneratorAgent } from '@opencobol/ai-runtime'

const BRAND = chalk.bold.hex('#00D4FF')
const DIM = chalk.dim
const SUCCESS = chalk.green
const FILE_COLOR = chalk.cyan

function formatBytes(str: string): string {
  const bytes = Buffer.byteLength(str, 'utf-8')
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

export const generateApiCommand = new Command('generate-api')
  .description('Generate a NestJS REST API from a COBOL program')
  .argument('<file>', 'COBOL source file')
  .option('--framework <name>', 'Target framework (nestjs)', 'nestjs')
  .option('--model <model>', 'OpenAI model', 'gpt-4o')
  .option('--output-dir <dir>', 'Output directory', './generated-api')
  .action(async (filePath: string, options: { framework: string; model: string; outputDir: string }) => {
    const resolvedPath = resolve(filePath)
    const programName = basename(filePath, extname(filePath)).toUpperCase()

    console.log()
    console.log(BRAND('  ██████  OpenCobol AI — Generate API'))
    console.log(DIM('  ─────────────────────────────────────'))
    console.log()
    console.log(`  ${chalk.bold.white('Program')}    ${FILE_COLOR(programName)}`)
    console.log(`  ${chalk.bold.white('Framework')} ${FILE_COLOR(options.framework)}`)
    console.log(`  ${chalk.bold.white('Output')}    ${FILE_COLOR(options.outputDir)}`)
    console.log()

    const spinner = ora({ text: 'Analyzing COBOL program…', color: 'cyan' }).start()

    const { result, error } = await runApiGeneratorAgent(resolvedPath, options.framework, {
      model: options.model,
    })

    spinner.stop()

    if (error || !result) {
      console.error(chalk.red(`  Error: ${error ?? 'No output generated'}`))
      process.exitCode = 1
      return
    }

    // Write files
    const outDir = join(resolve(options.outputDir), result.programName)
    mkdirSync(outDir, { recursive: true })

    console.log(SUCCESS(`  ✔ Generated ${Object.keys(result.files).length} files`))
    console.log()
    console.log(`  ${chalk.bold.white('Description')}`)
    console.log(`  ${DIM(result.description)}`)
    console.log()
    console.log(`  ${chalk.bold.white('Endpoints')}`)
    for (const ep of result.endpoints) {
      const method = ep.method.padEnd(6)
      console.log(`  ${chalk.green(method)} ${FILE_COLOR(ep.path)}  ${DIM(ep.description)}`)
    }
    console.log()
    console.log(`  ${chalk.bold.white('Files')}`)

    for (const [filename, content] of Object.entries(result.files)) {
      const filePath = join(outDir, filename)
      writeFileSync(filePath, content, 'utf-8')
      console.log(`  ${SUCCESS('→')} ${FILE_COLOR(join(result.programName, filename))}  ${DIM(formatBytes(content))}`)
    }

    console.log()
    console.log(DIM(`  Run: cd ${options.outputDir} && npm install`))
    console.log()
  })
