import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { resolve } from 'node:path'
import { indexDirectory } from '@opencobol/rag-engine'

const BRAND = chalk.bold.hex('#00D4FF')
const DIM = chalk.dim
const SUCCESS = chalk.green
const WARN = chalk.yellow
const LABEL = chalk.bold.white

export const embedCommand = new Command('embed')
  .description('Index a COBOL directory into the vector database for semantic search')
  .argument('<path>', 'Directory to index')
  .option('--qdrant <url>', 'Qdrant URL', 'http://localhost:6333')
  .option('--collection <name>', 'Qdrant collection name', 'opencobol')
  .action(async (targetPath: string, options: { qdrant: string; collection: string }) => {
    const resolvedPath = resolve(targetPath)

    console.log()
    console.log(BRAND('  ██████  OpenCobol AI — Embed'))
    console.log(DIM('  ─────────────────────────────────────'))
    console.log()
    console.log(`  ${LABEL('Path')}        ${chalk.cyan(resolvedPath)}`)
    console.log(`  ${LABEL('Qdrant')}      ${DIM(options.qdrant)}`)
    console.log(`  ${LABEL('Collection')}  ${DIM(options.collection)}`)
    console.log()

    const spinner = ora('Connecting to Qdrant…').start()
    let firstEvent = true

    try {
      for await (const progress of indexDirectory(resolvedPath, {
        qdrantUrl: options.qdrant,
        collection: options.collection,
      })) {
        if (firstEvent && progress.type !== 'done') {
          spinner.stop()
          firstEvent = false
        }

        if (progress.type === 'file') {
          console.log(
            `  ${SUCCESS('✔')}  ${chalk.cyan(progress.file ?? '')}  ` +
              DIM(`${progress.chunks} chunk${(progress.chunks ?? 0) > 1 ? 's' : ''} indexed`),
          )
        } else if (progress.type === 'skipped') {
          console.log(`  ${DIM('–')}  ${DIM(progress.file ?? '')}  ${DIM('unchanged, skipped')}`)
        } else if (progress.type === 'removed') {
          console.log(`  ${WARN('✕')}  ${chalk.yellow(progress.file ?? '')}  ${DIM('removed from index')}`)
        } else if (progress.type === 'error') {
          console.log(`  ${WARN('⚠')}  ${chalk.cyan(progress.file ?? '')}  ${WARN(progress.error ?? '')}`)
        } else if (progress.type === 'done') {
          if (firstEvent) { spinner.stop(); firstEvent = false }
          console.log()

          const parts = [
            `${SUCCESS(String(progress.total))} files scanned`,
            progress.indexed ? `${SUCCESS(String(progress.indexed))} chunks indexed` : null,
            progress.skipped ? `${DIM(String(progress.skipped))} unchanged` : null,
            progress.removed ? `${WARN(String(progress.removed))} removed` : null,
          ].filter(Boolean).join('  ·  ')

          console.log(`  ${SUCCESS('Done!')}  ${parts}`)
          console.log()
          console.log(DIM(`  Run ${chalk.white('opencobol ask')} to start querying.`))
          console.log()
        }
      }
    } catch (err) {
      spinner.fail(`Embed failed: ${(err as Error).message}`)
      process.exitCode = 1
    }
  })
