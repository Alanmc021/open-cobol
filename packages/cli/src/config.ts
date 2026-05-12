import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export interface OpenCobolConfig {
  openaiApiKey?: string
  model?: string
  qdrantUrl?: string
  qdrantCollection?: string
}

const CONFIG_DIR = join(homedir(), '.opencobol')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

export function loadConfig(): OpenCobolConfig {
  let fileConfig: OpenCobolConfig = {}
  if (existsSync(CONFIG_PATH)) {
    try {
      fileConfig = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
    } catch {}
  }
  return {
    openaiApiKey: process.env['OPENAI_API_KEY'] ?? fileConfig.openaiApiKey,
    model: process.env['OPENAI_MODEL'] ?? fileConfig.model,
    qdrantUrl: process.env['QDRANT_URL'] ?? fileConfig.qdrantUrl,
    qdrantCollection: process.env['QDRANT_COLLECTION'] ?? fileConfig.qdrantCollection,
  }
}

export function saveConfig(config: OpenCobolConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

export function applyConfig(): void {
  const config = loadConfig()
  if (config.openaiApiKey && !process.env['OPENAI_API_KEY']) {
    process.env['OPENAI_API_KEY'] = config.openaiApiKey
  }
  if (config.model && !process.env['OPENAI_MODEL']) {
    process.env['OPENAI_MODEL'] = config.model
  }
  if (config.qdrantUrl && !process.env['QDRANT_URL']) {
    process.env['QDRANT_URL'] = config.qdrantUrl
  }
  if (config.qdrantCollection && !process.env['QDRANT_COLLECTION']) {
    process.env['QDRANT_COLLECTION'] = config.qdrantCollection
  }
}

export { CONFIG_PATH }
