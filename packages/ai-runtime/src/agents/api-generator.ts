import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { analyzeFile, extractFlow } from '@opencobol/parser-core'
import type { CobolFile, FlowResult } from '@opencobol/shared'
import { buildApiGeneratorPrompt } from '../prompts/api-generator.js'
import type { AgentRunOptions } from './types.js'

export interface GeneratedEndpoint {
  method: string
  path: string
  description: string
}

export interface GeneratedApi {
  programName: string
  description: string
  endpoints: GeneratedEndpoint[]
  files: Record<string, string>
}

const ApiGeneratorAnnotation = Annotation.Root({
  filePath: Annotation<string>(),
  framework: Annotation<string>(),
  cobolFile: Annotation<CobolFile | undefined>(),
  sourceCode: Annotation<string | undefined>(),
  flow: Annotation<FlowResult | undefined>(),
  result: Annotation<GeneratedApi | undefined>(),
  error: Annotation<string | undefined>(),
})

type ApiGeneratorState = typeof ApiGeneratorAnnotation.State

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {}
  const block = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
  if (block?.[1]) {
    try {
      return JSON.parse(block[1])
    } catch {}
  }
  const brace = text.match(/\{[\s\S]+\}/)
  if (brace?.[0]) {
    return JSON.parse(brace[0])
  }
  throw new Error('Could not extract JSON from LLM response')
}

function buildGraph(options: AgentRunOptions) {
  const llm = new ChatOpenAI({
    model: options.model ?? 'gpt-4o',
    temperature: options.temperature ?? 0,
  })

  return new StateGraph(ApiGeneratorAnnotation)
    .addNode('analyze', async (state: ApiGeneratorState): Promise<Partial<ApiGeneratorState>> => {
      try {
        const path = resolve(state.filePath)
        const cobolFile = analyzeFile(path)
        const sourceCode = readFileSync(path, 'utf-8')
        let flow: FlowResult | undefined
        try {
          flow = extractFlow(path)
        } catch {}
        return { cobolFile, sourceCode, flow }
      } catch (e) {
        return { error: (e as Error).message }
      }
    })
    .addNode('generate', async (state: ApiGeneratorState): Promise<Partial<ApiGeneratorState>> => {
      if (state.error || !state.cobolFile || !state.sourceCode) return {}
      try {
        const prompt = buildApiGeneratorPrompt(
          state.cobolFile,
          state.sourceCode,
          state.flow,
          state.framework,
        )
        const response = await llm.invoke(prompt)
        const parsed = extractJson(response.content as string) as GeneratedApi
        return { result: parsed }
      } catch (e) {
        return { error: (e as Error).message }
      }
    })
    .addEdge(START, 'analyze')
    .addEdge('analyze', 'generate')
    .addEdge('generate', END)
    .compile()
}

export async function runApiGeneratorAgent(
  filePath: string,
  framework = 'nestjs',
  options: AgentRunOptions = {},
): Promise<{ result: GeneratedApi | undefined; error: string | undefined }> {
  const graph = buildGraph(options)
  const state = await graph.invoke({ filePath, framework })
  return { result: state.result, error: state.error }
}
