import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { createInterface } from 'node:readline'
import { retrieve, buildRagPrompt } from '@opencobol/rag-engine'
import { OpenAIProvider } from '@opencobol/ai-runtime'

const BRAND = chalk.bold.hex('#00D4FF')
const DIM = chalk.dim
const PROMPT_CHAR = chalk.bold.hex('#00D4FF')('▶')
const AI_COLOR = chalk.white

function applyMarkdownColors(text: string): string {
  return text
    .replace(/^(#{1,3} .+)$/gm, (m) => chalk.bold.white(m))
    .replace(/\*\*(.+?)\*\*/g, (_, t) => chalk.bold(t))
    .replace(/`(.+?)`/g, (_, t) => chalk.cyan(t))
}

async function answerQuestion(
  question: string,
  options: { qdrant: string; collection: string; model: string; topK: number },
): Promise<void> {
  const spinner = ora({ text: 'Searching codebase…', color: 'cyan' }).start()

  let contexts
  try {
    contexts = await retrieve(question, {
      qdrantUrl: options.qdrant,
      collection: options.collection,
      topK: options.topK,
    })
    spinner.stop()
  } catch (err) {
    spinner.fail(`Retrieval failed: ${(err as Error).message}`)
    return
  }

  if (contexts.length === 0) {
    console.log(DIM('\n  No relevant context found. Try running opencobol embed first.\n'))
    return
  }

  // Show which files were used as context
  const sources = [...new Set(contexts.map((c) => c.hit.payload.file))]
  console.log(DIM(`\n  Context from: ${sources.join(', ')}\n`))

  const provider = new OpenAIProvider()
  const prompt = buildRagPrompt(question, contexts)

  console.log(chalk.dim('  ─────────────────────────────────────'))
  console.log()

  let firstChunk = true
  const genSpinner = ora({ text: 'Generating answer…', color: 'cyan' }).start()

  try {
    for await (const chunk of provider.streamCompletion(prompt, { model: options.model })) {
      if (firstChunk) {
        genSpinner.stop()
        firstChunk = false
        process.stdout.write('  ')
      }
      process.stdout.write(AI_COLOR(applyMarkdownColors(chunk.text)))
    }
    console.log('\n')
  } catch (err) {
    genSpinner.fail(`Generation failed: ${(err as Error).message}`)
  }
}

export const askCommand = new Command('ask')
  .description('Ask a question about your COBOL codebase using semantic search + AI')
  .argument('[question]', 'Question to ask (omit for interactive mode)')
  .option('--qdrant <url>', 'Qdrant URL', 'http://localhost:6333')
  .option('--collection <name>', 'Qdrant collection name', 'opencobol')
  .option('--model <model>', 'OpenAI model', 'gpt-4o')
  .option('--top-k <n>', 'Number of context chunks to retrieve', '5')
  .action(async (question: string | undefined, options: { qdrant: string; collection: string; model: string; topK: string }) => {
    const resolvedOptions = { ...options, topK: parseInt(options.topK, 10) }

    // One-shot mode
    if (question) {
      await answerQuestion(question, resolvedOptions)
      return
    }

    // Interactive REPL
    console.log()
    console.log(BRAND('  ██████  OpenCobol AI — Ask'))
    console.log(DIM('  Type a question about your COBOL codebase. Ctrl+C to exit.'))
    console.log()

    const rl = createInterface({ input: process.stdin, output: process.stdout })

    const loop = () => {
      rl.question(`  ${PROMPT_CHAR} `, async (input) => {
        const trimmed = input.trim()
        if (!trimmed) { loop(); return }
        if (trimmed === '/exit' || trimmed === '/quit') {
          console.log(DIM('\n  Bye!\n'))
          rl.close()
          return
        }
        await answerQuestion(trimmed, resolvedOptions)
        loop()
      })
    }

    loop()
  })
