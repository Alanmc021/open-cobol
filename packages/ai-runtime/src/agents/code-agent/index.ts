import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildCodeAgentGraph } from './graph.js'
import { threadId } from './checkpointer.js'
import type { CodeAgentInput } from './types.js'
import type { CodeAgentState } from './state.js'

export type { CodeAgentInput, CodeAgentOptions, BusinessRule, GeneratedFile, ValidationResult, AgentPhase } from './types.js'

export const NODE_LABELS: Record<string, string> = {
  'analyze': 'Analyzing COBOL program…',
  'enrich-rag': 'Searching codebase context…',
  'extract-rules': 'Extracting business rules…',
  'gen-tests': 'Generating tests…',
  'gen-code': 'Generating code…',
  'validate': 'Running validation…',
  'fix-code': 'Fixing errors…',
  'write-files': 'Writing files…',
  'summarize': 'Generating migration notes…',
}

export async function runCodeAgent(input: CodeAgentInput): Promise<CodeAgentState> {
  mkdirSync(resolve(input.outputDir), { recursive: true })

  const graph = buildCodeAgentGraph()
  const config = { configurable: { thread_id: threadId(input.filePath, input.targetLanguage) } }

  const result = await graph.invoke(
    {
      filePath: input.filePath,
      targetLanguage: input.targetLanguage,
      outputDir: input.outputDir,
      options: input.options,
    },
    config,
  )

  return result as CodeAgentState
}

export async function* streamCodeAgent(
  input: CodeAgentInput,
): AsyncGenerator<{ node: string; state: Partial<CodeAgentState> }> {
  mkdirSync(resolve(input.outputDir), { recursive: true })

  const graph = buildCodeAgentGraph()
  const config = {
    configurable: { thread_id: threadId(input.filePath, input.targetLanguage) },
    streamMode: 'updates' as const,
  }

  const stream = await graph.stream(
    {
      filePath: input.filePath,
      targetLanguage: input.targetLanguage,
      outputDir: input.outputDir,
      options: input.options,
    },
    config,
  )

  for await (const updates of stream) {
    for (const [node, state] of Object.entries(updates)) {
      yield { node, state: state as Partial<CodeAgentState> }
    }
  }
}
