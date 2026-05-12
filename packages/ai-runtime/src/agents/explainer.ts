import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { analyzeFile } from '@opencobol/parser-core'
import type { CobolFile } from '@opencobol/shared'
import { buildExplainPrompt } from '../prompts/explain.js'
import type { AgentRunOptions } from './types.js'

const ExplainerAnnotation = Annotation.Root({
  filePath: Annotation<string>(),
  cobolFile: Annotation<CobolFile | undefined>(),
  sourceCode: Annotation<string | undefined>(),
  explanation: Annotation<string | undefined>(),
  error: Annotation<string | undefined>(),
})

type ExplainerState = typeof ExplainerAnnotation.State

function buildGraph(options: AgentRunOptions) {
  const llm = new ChatOpenAI({
    model: options.model ?? 'gpt-4o',
    temperature: options.temperature ?? 0,
  })

  return new StateGraph(ExplainerAnnotation)
    .addNode('parse', async (state: ExplainerState): Promise<Partial<ExplainerState>> => {
      try {
        const path = resolve(state.filePath)
        return {
          cobolFile: analyzeFile(path),
          sourceCode: readFileSync(path, 'utf-8'),
        }
      } catch (e) {
        return { error: (e as Error).message }
      }
    })
    .addNode('generate', async (state: ExplainerState): Promise<Partial<ExplainerState>> => {
      if (state.error || !state.cobolFile || !state.sourceCode) return {}
      try {
        const prompt = buildExplainPrompt(state.cobolFile, state.sourceCode)
        const response = await llm.invoke(prompt)
        return { explanation: response.content as string }
      } catch (e) {
        return { error: (e as Error).message }
      }
    })
    .addEdge(START, 'parse')
    .addEdge('parse', 'generate')
    .addEdge('generate', END)
    .compile()
}

export async function runExplainerAgent(
  filePath: string,
  options: AgentRunOptions = {},
): Promise<{ explanation: string | undefined; error: string | undefined }> {
  const graph = buildGraph(options)
  const result = await graph.invoke({ filePath })
  return { explanation: result.explanation, error: result.error }
}
