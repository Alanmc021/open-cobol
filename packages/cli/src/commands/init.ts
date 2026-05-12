import { Command } from 'commander'
import { input, password, select, confirm } from '@inquirer/prompts'
import chalk from 'chalk'
import ora from 'ora'
import { saveConfig, CONFIG_PATH, type OpenCobolConfig } from '../config.js'

const LOGO = `
  ██████╗  ██████╗ ███████╗██████╗  ██████╗ ██╗
 ██╔════╝ ██╔═══██╗██╔════╝██╔══██╗██╔═══██╗██║
 ██║      ██║   ██║███████╗██████╔╝██║   ██║██║
 ██║      ██║   ██║╚════██║██╔══██╗██║   ██║██║
 ╚██████╗ ╚██████╔╝███████║██████╔╝╚██████╔╝███████╗
  ╚═════╝  ╚═════╝ ╚══════╝╚═════╝  ╚═════╝╚══════╝
`

function printBanner(version: string) {
  const width = 56
  const border = chalk.cyan('═'.repeat(width))
  const side = chalk.cyan('║')

  const line = (text: string, pad = true) => {
    const visible = text.replace(/\x1b\[[0-9;]*m/g, '')
    const spaces = pad ? ' '.repeat(Math.max(0, width - visible.length - 2)) : ''
    return `${side} ${text}${spaces} ${side}`
  }

  console.log()
  console.log(chalk.cyan(`╔${border}╗`))
  console.log(line(chalk.bold.white('OpenCobol') + chalk.bold.cyan(' AI') + chalk.dim('  ·  Legacy COBOL Intelligence Platform')))
  console.log(line(chalk.dim(`Created by `) + chalk.cyan('Alan Martins') + chalk.dim(`  ·  v${version}`)))
  console.log(chalk.cyan(`╚${border}╝`))
  console.log()
}

async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    return res.ok
  } catch {
    return false
  }
}

export const initCommand = new Command('init')
  .description('Configure OpenCobol AI interactively')
  .action(async () => {
    printBanner('0.1.3')

    console.log(chalk.dim('  Setup Wizard — configure your environment in under a minute.\n'))

    const config: OpenCobolConfig = {}

    // API Key
    const apiKey = await password({
      message: 'OpenAI API Key',
      mask: '●',
      validate: (v) => (v.startsWith('sk-') && v.length > 20 ? true : 'Key must start with sk- and be valid'),
    })

    const spinner = ora({ text: 'Validating API key...', color: 'cyan' }).start()
    const valid = await validateApiKey(apiKey)
    if (valid) {
      spinner.succeed(chalk.green('API key validated'))
    } else {
      spinner.warn(chalk.yellow('Could not validate key — saved anyway (check your connection)'))
    }
    config.openaiApiKey = apiKey

    console.log()

    // Model
    config.model = await select({
      message: 'Default model',
      choices: [
        { name: `${chalk.green('gpt-4o-mini')}  — fast & affordable ${chalk.dim('(recommended)')}`, value: 'gpt-4o-mini' },
        { name: `${chalk.yellow('gpt-4o')}       — most capable`, value: 'gpt-4o' },
        { name: `${chalk.dim('gpt-4-turbo')}  — balanced`, value: 'gpt-4-turbo' },
      ],
    })

    console.log()

    // Qdrant
    const useQdrant = await confirm({
      message: 'Enable semantic search with Qdrant? ' + chalk.dim('(needed for embed & ask)'),
      default: true,
    })

    if (useQdrant) {
      console.log()
      config.qdrantUrl = await input({
        message: 'Qdrant URL',
        default: 'http://localhost:6333',
      })
      config.qdrantCollection = await input({
        message: 'Qdrant collection name',
        default: 'opencobol',
      })
    }

    saveConfig(config)

    console.log()
    console.log(chalk.cyan('─'.repeat(58)))
    console.log()
    console.log(`  ${chalk.green('✔')}  Config saved to ${chalk.dim(CONFIG_PATH)}`)
    console.log()
    console.log(`  ${chalk.bold('Next steps:')}`)
    console.log()
    if (useQdrant) {
      console.log(`  ${chalk.dim('$')} ${chalk.cyan('docker run -p 6333:6333 qdrant/qdrant')}`)
      console.log(`  ${chalk.dim('$')} ${chalk.cyan('opencobol embed ./legacy')}`)
      console.log(`  ${chalk.dim('$')} ${chalk.cyan('opencobol ask "What does this system do?"')}`)
    } else {
      console.log(`  ${chalk.dim('$')} ${chalk.cyan('opencobol scan ./legacy')}`)
      console.log(`  ${chalk.dim('$')} ${chalk.cyan('opencobol explain ./legacy/PAYROLL.cbl')}`)
    }
    console.log()
    console.log(chalk.cyan('─'.repeat(58)))
    console.log()
  })
