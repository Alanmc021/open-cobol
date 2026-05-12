import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { analyzeFile, extractFlow } from '@opencobol/parser-core'
import type { CobolFile } from '@opencobol/shared'
import type { FlowResult } from '@opencobol/shared'
import { buildModernizationPrompt } from '../prompts/modernization.js'
import type { AgentRunOptions } from './types.js'

const ModernizationAnnotation = Annotation.Root({
  filePath: Annotation<string>(),
  targetLanguage: Annotation<string>(),
  cobolFile: Annotation<CobolFile | undefined>(),
  sourceCode: Annotation<string | undefined>(),
  flow: Annotation<FlowResult | undefined>(),
  plan: Annotation<string | undefined>(),
  error: Annotation<string | undefined>(),
})

type ModernizationState = typeof ModernizationAnnotation.State

function buildGraph(options: AgentRunOptions) {
  const llm = new ChatOpenAI({
    model: options.model ?? 'gpt-4o',
    temperature: options.temperature ?? 0,
  })

  return new StateGraph(ModernizationAnnotation)
    .addNode('analyze', async (state: ModernizationState): Promise<Partial<ModernizationState>> => {
      try {
        const path = resolve(state.filePath)
        const cobolFile = analyzeFile(path)
        const sourceCode = readFileSync(path, 'utf-8')
        let flow: FlowResult | undefined
        try {
          flow = extractFlow(path)
        } catch {
          // flow extraction is best-effort
        }
        return { cobolFile, sourceCode, flow }
      } catch (e) {
        return { error: (e as Error).message }
      }
    })
    .addNode('generate', async (state: ModernizationState): Promise<Partial<ModernizationState>> => {
      if (state.error || !state.cobolFile || !state.sourceCode) return {}
      try {
        const prompt = buildModernizationPrompt(
          state.cobolFile,
          state.sourceCode,
          state.flow,
          state.targetLanguage,
        )
        const response = await llm.invoke(prompt)
        return { plan: response.content as string }
      } catch (e) {
        return { error: (e as Error).message }
      }
    })
    .addEdge(START, 'analyze')
    .addEdge('analyze', 'generate')
    .addEdge('generate', END)
    .compile()
}

export async function runModernizationAgent(
  filePath: string,
  targetLanguage = 'typescript',
  options: AgentRunOptions = {},
): Promise<{ plan: string | undefined; error: string | undefined }> {
  const graph = buildGraph(options)
  const result = await graph.invoke({ filePath, targetLanguage })
  return { plan: result.plan, error: result.error }
}
