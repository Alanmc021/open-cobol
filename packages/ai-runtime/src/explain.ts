import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { analyzeFile } from '@opencobol/parser-core'
import type { CobolFile } from '@opencobol/shared'
import { buildExplainPrompt } from './prompts/explain.js'
import { OpenAIProvider } from './providers/openai.js'
import type { AIProvider, CompletionOptions } from './providers/base.js'

export interface ExplainOptions extends CompletionOptions {
  provider?: AIProvider
}

export interface ExplainInput {
  filePath: string
  options?: ExplainOptions
}

export async function* explainFile(input: ExplainInput): AsyncIterable<string> {
  const resolvedPath = resolve(input.filePath)
  const file: CobolFile = analyzeFile(resolvedPath)
  const sourceCode = readFileSync(resolvedPath, 'utf-8')

  const provider = input.options?.provider ?? new OpenAIProvider()
  const prompt = buildExplainPrompt(file, sourceCode)

  for await (const chunk of provider.streamCompletion(prompt, input.options)) {
    if (chunk.text) yield chunk.text
  }
}

export { buildExplainPrompt } from './prompts/explain.js'
export { OpenAIProvider } from './providers/openai.js'
export type { AIProvider, CompletionOptions } from './providers/base.js'
