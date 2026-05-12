import { Command } from 'commander'
import ora from 'ora'
import { resolve } from 'node:path'
import { scanDirectory } from '@opencobol/parser-core'
import { renderScanResult } from '../ui/renderer.js'

export const scanCommand = new Command('scan')
  .description('Scan a directory for COBOL files and analyze dependencies')
  .argument('<path>', 'Directory to scan')
  .option('--json', 'Output raw JSON')
  .action(async (targetPath: string, options: { json?: boolean }) => {
    const resolvedPath = resolve(targetPath)
    const spinner = ora(`Scanning ${resolvedPath} …`).start()

    try {
      const result = scanDirectory(resolvedPath)
      spinner.stop()

      if (options.json) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n')
        return
      }

      renderScanResult(result)
    } catch (err) {
      spinner.fail(`Scan failed: ${(err as Error).message}`)
      process.exitCode = 1
    }
  })
