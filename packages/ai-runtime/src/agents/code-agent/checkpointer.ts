import { MemorySaver } from '@langchain/langgraph'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'

export function createCheckpointer() {
  // SqliteSaver requires an optional peer dep — fall back to MemorySaver gracefully
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SqliteSaver } = require('@langchain/langgraph-checkpoint-sqlite')
    const dir = join(homedir(), '.opencobol', 'checkpoints')
    mkdirSync(dir, { recursive: true })
    return SqliteSaver.fromConnString(join(dir, 'agent.db'))
  } catch {
    return new MemorySaver()
  }
}

export function threadId(filePath: string, targetLanguage: string): string {
  return createHash('sha1').update(`${filePath}:${targetLanguage}`).digest('hex').slice(0, 16)
}
