import * as vscode from 'vscode'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

interface OpenCobolConfig {
  openaiApiKey?: string
  model?: string
  qdrantUrl?: string
  qdrantCollection?: string
}

function loadFileConfig(): OpenCobolConfig {
  const path = join(homedir(), '.opencobol', 'config.json')
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as OpenCobolConfig
  } catch {
    return {}
  }
}

export function getConfig() {
  const ws = vscode.workspace.getConfiguration('opencobol')
  const file = loadFileConfig()

  const apiKey =
    ws.get<string>('openaiApiKey') ||
    process.env['OPENAI_API_KEY'] ||
    file.openaiApiKey ||
    ''

  const model =
    ws.get<string>('model') ||
    process.env['OPENAI_MODEL'] ||
    file.model ||
    'gpt-4o-mini'

  const qdrantUrl =
    ws.get<string>('qdrantUrl') ||
    process.env['QDRANT_URL'] ||
    file.qdrantUrl ||
    'http://localhost:6333'

  const qdrantCollection =
    ws.get<string>('qdrantCollection') ||
    process.env['QDRANT_COLLECTION'] ||
    file.qdrantCollection ||
    'opencobol'

  return { apiKey, model, qdrantUrl, qdrantCollection }
}

export function applyConfig() {
  const { apiKey, model, qdrantUrl, qdrantCollection } = getConfig()
  if (apiKey && !process.env['OPENAI_API_KEY']) process.env['OPENAI_API_KEY'] = apiKey
  if (model && !process.env['OPENAI_MODEL']) process.env['OPENAI_MODEL'] = model
  if (qdrantUrl && !process.env['QDRANT_URL']) process.env['QDRANT_URL'] = qdrantUrl
  if (qdrantCollection && !process.env['QDRANT_COLLECTION']) process.env['QDRANT_COLLECTION'] = qdrantCollection
}
