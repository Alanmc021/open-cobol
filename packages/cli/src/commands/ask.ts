import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { createInterface } from 'node:readline'
import { retrieve, buildRagSystemPrompt } from '@opencobol/rag-engine'
import { OpenAIProvider } from '@opencobol/ai-runtime'
import type { ChatMessage } from '@opencobol/ai-runtime'

const BRAND = chalk.bold.hex('#00D4FF')
const DIM = chalk.dim
const META = chalk.dim.italic
const AI_COLOR = chalk.white
const HINT = chalk.dim.yellow

function makePrompt(collection: string) {
  return `  ${chalk.bold.hex('#00D4FF')(`▶ [${collection}]`)} `
}

function applyMarkdownColors(text: string): string {
  return text
    .replace(/^(#{1,3} .+)$/gm, (m) => chalk.bold.white(m))
    .replace(/\*\*(.+?)\*\*/g, (_, t) => chalk.bold(t))
    .replace(/`(.+?)`/g, (_, t) => chalk.cyan(t))
}

// Enrich the RAG query with history context so follow-up questions find the right code
function buildRagQuery(question: string, history: ChatMessage[]): string {
  const lastUser = history.filter((m) => m.role === 'user').at(-1)
  if (!lastUser) return question
  return `${lastUser.content} ${question}`
}

interface AskOptions {
  qdrant: string
  collection: string
  model: string
  topK: number
}

async function chat(
  question: string,
  history: ChatMessage[],
  options: AskOptions,
  provider: OpenAIProvider,
): Promise<string> {
  const spinner = ora({ text: 'Searching codebase…', color: 'cyan' }).start()

  const ragQuery = buildRagQuery(question, history)

  let system: string
  let sources: string[]
  try {
    const contexts = await retrieve(ragQuery, {
      qdrantUrl: options.qdrant,
      collection: options.collection,
      topK: options.topK,
    })
    spinner.stop()
    sources = [...new Set(contexts.map((c) => c.hit.payload.file))]
    system = buildRagSystemPrompt(contexts)
  } catch (err) {
    spinner.fail(`Retrieval failed: ${(err as Error).message}`)
    return ''
  }

  if (sources.length === 0) {
    console.log(DIM('\n  No relevant context found. Try running opencobol embed first.\n'))
    return ''
  }

  console.log(META(`\n  Context: ${sources.join(', ')}\n`))
  console.log(DIM('  ─────────────────────────────────────'))
  console.log()

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    ...history,
    { role: 'user', content: question },
  ]

  let fullAnswer = ''
  let firstChunk = true
  const genSpinner = ora({ text: 'Generating…', color: 'cyan' }).start()

  try {
    for await (const chunk of provider.streamChat(messages, { model: options.model })) {
      if (firstChunk) {
        genSpinner.stop()
        firstChunk = false
        process.stdout.write('  ')
      }
      if (chunk.text) {
        process.stdout.write(AI_COLOR(applyMarkdownColors(chunk.text)))
        fullAnswer += chunk.text
      }
    }
    console.log('\n')
  } catch (err) {
    genSpinner.fail(`Generation failed: ${(err as Error).message}`)
  }

  return fullAnswer
}

export const askCommand = new Command('ask')
  .description('Chat with your COBOL codebase — conversation memory + collection switching')
  .argument('[question]', 'Question to ask (omit for interactive mode)')
  .option('--qdrant <url>', 'Qdrant URL', 'http://localhost:6333')
  .option('--collection <name>', 'Qdrant collection name', 'opencobol')
  .option('--model <model>', 'OpenAI model', 'gpt-4o')
  .option('--top-k <n>', 'Number of context chunks to retrieve', '5')
  .action(
    async (
      question: string | undefined,
      opts: { qdrant: string; collection: string; model: string; topK: string },
    ) => {
      const options: AskOptions = { ...opts, topK: parseInt(opts.topK, 10) }
      const provider = new OpenAIProvider()

      // One-shot mode
      if (question) {
        await chat(question, [], options, provider)
        return
      }

      // Interactive REPL — use rl.prompt() + rl.on('line') to keep the loop alive
      console.log()
      console.log(BRAND('  ██████  OpenCobol AI — Chat'))
      console.log(DIM(`  Collection: ${options.collection} · Model: ${options.model}`))
      console.log(DIM('  /exit to quit  ·  /clear to reset  ·  /collection <name> to switch  ·  /help'))
      console.log()

      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        prompt: makePrompt(options.collection),
      })

      const history: ChatMessage[] = []

      rl.on('close', () => {
        console.log(DIM('\n  Até logo!\n'))
        process.exit(0)
      })

      rl.on('line', async (rawInput) => {
        // Pause readline while processing — prevents double-prompts and lost input
        rl.pause()

        const trimmed = rawInput.trim()

        if (!trimmed) {
          rl.setPrompt(makePrompt(options.collection))
          rl.prompt()
          return
        }

        if (trimmed === '/exit' || trimmed === '/quit') {
          rl.close()
          return
        }

        if (trimmed === '/clear') {
          history.length = 0
          console.log(DIM('\n  Histórico limpo. Nova conversa iniciada.\n'))
          rl.setPrompt(makePrompt(options.collection))
          rl.prompt()
          return
        }

        if (trimmed === '/history') {
          if (history.length === 0) {
            console.log(DIM('\n  Nenhuma mensagem no histórico ainda.\n'))
          } else {
            console.log()
            history.forEach((m, i) => {
              const label =
                m.role === 'user' ? chalk.bold.cyan('  Você') : chalk.bold.white('  AI  ')
              const preview = m.content.length > 140 ? m.content.slice(0, 140) + '…' : m.content
              console.log(`${label} [${Math.floor(i / 2) + 1}]: ${DIM(preview)}`)
            })
            console.log()
          }
          rl.setPrompt(makePrompt(options.collection))
          rl.prompt()
          return
        }

        if (trimmed.startsWith('/collection')) {
          const newCollection = trimmed.split(/\s+/)[1]?.trim()
          if (!newCollection) {
            console.log(HINT(`\n  Collection atual: ${options.collection}\n  Uso: /collection <nome>\n`))
          } else {
            options.collection = newCollection
            history.length = 0
            console.log(DIM(`\n  Switched to "${newCollection}". Histórico resetado.\n`))
          }
          rl.setPrompt(makePrompt(options.collection))
          rl.prompt()
          return
        }

        if (trimmed === '/help') {
          console.log(`
  ${chalk.bold('Comandos disponíveis:')}
  ${chalk.cyan('/collection <name>')}   Troca a collection (reseta o histórico)
  ${chalk.cyan('/clear')}               Reseta o histórico da conversa
  ${chalk.cyan('/history')}             Mostra as mensagens da sessão
  ${chalk.cyan('/exit')}                Sai do chat
`)
          rl.setPrompt(makePrompt(options.collection))
          rl.prompt()
          return
        }

        // Chat turn
        const answer = await chat(trimmed, history, options, provider)

        if (answer) {
          history.push({ role: 'user', content: trimmed })
          history.push({ role: 'assistant', content: answer })
        }

        rl.setPrompt(makePrompt(options.collection))
        rl.prompt()
      })

      // Show the first prompt
      rl.prompt()
    },
  )
