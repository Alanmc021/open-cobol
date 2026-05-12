import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { analyzeFile, extractFlow } from '@opencobol/parser-core'
import type { CobolFile } from '@opencobol/shared'
import type { FlowResult } from '@opencobol/shared'
import { buildDocsPrompt } from '../prompts/docs.js'
import type { AgentRunOptions } from './types.js'

const DocsAnnotation = Annotation.Root({
  filePath: Annotation<string>(),
  cobolFile: Annotation<CobolFile | undefined>(),
  sourceCode: Annotation<string | undefined>(),
  flow: Annotation<FlowResult | undefined>(),
  documentation: Annotation<string | undefined>(),
  error: Annotation<string | undefined>(),
})

type DocsState = typeof DocsAnnotation.State

function buildGraph(options: AgentRunOptions) {
  const llm = new ChatOpenAI({
    model: options.model ?? 'gpt-4o',
    temperature: options.temperature ?? 0,
  })

  return new StateGraph(DocsAnnotation)
    .addNode('parse', async (state: DocsState): Promise<Partial<DocsState>> => {
      try {
        const path = resolve(state.filePath)
        const cobolFile = analyzeFile(path)
        const sourceCode = readFileSync(path, 'utf-8')
        let flow: FlowResult | undefined
        try {
          flow = extractFlow(path)
        } catch {
          // best-effort
        }
        return { cobolFile, sourceCode, flow }
      } catch (e) {
        return { error: (e as Error).message }
      }
    })
    .addNode('generate', async (state: DocsState): Promise<Partial<DocsState>> => {
      if (state.error || !state.cobolFile || !state.sourceCode) return {}
      try {
        const prompt = buildDocsPrompt(state.cobolFile, state.sourceCode, state.flow)
        const response = await llm.invoke(prompt)
        return { documentation: response.content as string }
      } catch (e) {
        return { error: (e as Error).message }
      }
    })
    .addEdge(START, 'parse')
    .addEdge('parse', 'generate')
    .addEdge('generate', END)
    .compile()
}

export async function runDocsAgent(
  filePath: string,
  options: AgentRunOptions = {},
): Promise<{ documentation: string | undefined; error: string | undefined }> {
  const graph = buildGraph(options)
  const result = await graph.invoke({ filePath })
  return { documentation: result.documentation, error: result.error }
}
