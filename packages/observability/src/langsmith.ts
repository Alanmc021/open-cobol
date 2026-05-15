export interface LangSmithConfig {
  apiKey: string
  project: string
  endpoint?: string
}

export function setupLangSmith(config: LangSmithConfig): void {
  process.env['LANGCHAIN_TRACING_V2'] = 'true'
  process.env['LANGCHAIN_API_KEY'] = config.apiKey
  process.env['LANGCHAIN_PROJECT'] = config.project
  if (config.endpoint) {
    process.env['LANGCHAIN_ENDPOINT'] = config.endpoint
  }
}

export function isLangSmithEnabled(): boolean {
  return (
    process.env['LANGCHAIN_TRACING_V2'] === 'true' &&
    !!process.env['LANGCHAIN_API_KEY']
  )
}

export function getLangSmithConfig(): LangSmithConfig | null {
  const apiKey = process.env['LANGCHAIN_API_KEY']
  const project = process.env['LANGCHAIN_PROJECT'] ?? 'opencobol-ai'
  if (!apiKey) return null
  return { apiKey, project }
}
