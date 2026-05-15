import 'dotenv/config'
import { applyConfig } from './config.js'
import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { scanCommand } from './commands/scan.js'
import { explainCommand } from './commands/explain.js'
import { flowCommand } from './commands/flow.js'
import { embedCommand } from './commands/embed.js'
import { askCommand } from './commands/ask.js'
import { depsCommand } from './commands/deps.js'
import { modernizeCommand } from './commands/modernize.js'
import { docsCommand } from './commands/docs.js'
import { generateApiCommand } from './commands/generate-api.js'
import { agentCommand } from './commands/agent.js'
import { diagramCommand } from './commands/diagram.js'
import { analyzeCommand } from './commands/analyze.js'

applyConfig()

const program = new Command()

program
  .name('opencobol')
  .description('OpenCobol AI — Transform legacy COBOL into AI-navigable context')
  .version('0.1.0')

program.addCommand(initCommand)
program.addCommand(scanCommand)
program.addCommand(explainCommand)
program.addCommand(flowCommand)
program.addCommand(embedCommand)
program.addCommand(askCommand)
program.addCommand(depsCommand)
program.addCommand(modernizeCommand)
program.addCommand(docsCommand)
program.addCommand(generateApiCommand)
program.addCommand(agentCommand)
program.addCommand(diagramCommand)
program.addCommand(analyzeCommand)

program.parse(process.argv)
