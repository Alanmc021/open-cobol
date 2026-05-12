import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { analyzeFile, buildCallDependencies, buildCopybookDependencies, scanDirectory } from '@opencobol/parser-core'
import type { CallDependency, CobolFile, CopybookDependency, ScanResult } from '@opencobol/shared'
import { buildDependencyPrompt } from '../prompts/dependency.js'
import type { AgentRunOptions } from './types.js'

const DependencyAnnotation = Annotation.Root({
  rootPath: Annotation<string>(),
  targetProgram: Annotation<string | undefined>(),
  scanResult: Annotation<ScanResult | undefined>(),
  callDeps: Annotation<CallDependency[] | undefined>(),
  copybookDeps: Annotation<CopybookDependency[] | undefined>(),
  report: Annotation<string | undefined>(),
  error: Annotation<string | undefined>(),
})

type DependencyState = typeof DependencyAnnotation.State

function buildGraph(options: AgentRunOptions) {
  const llm = new ChatOpenAI({
    model: options.model ?? 'gpt-4o',
    temperature: options.temperature ?? 0,
  })

  return new StateGraph(DependencyAnnotation)
    .addNode('scan', async (state: DependencyState): Promise<Partial<DependencyState>> => {
      try {
        const scanResult = await scanDirectory(state.rootPath)
        return {
          scanResult,
          callDeps: buildCallDependencies(scanResult.files),
          copybookDeps: buildCopybookDependencies(scanResult.files),
        }
      } catch (e) {
        return { error: (e as Error).message }
      }
    })
    .addNode('analyze', async (state: DependencyState): Promise<Partial<DependencyState>> => {
      if (state.error || !state.scanResult) return {}
      try {
        const prompt = buildDependencyPrompt(
          state.scanResult,
          state.callDeps ?? [],
          state.copybookDeps ?? [],
          state.targetProgram,
        )
        const response = await llm.invoke(prompt)
        return { report: response.content as string }
      } catch (e) {
        return { error: (e as Error).message }
      }
    })
    .addEdge(START, 'scan')
    .addEdge('scan', 'analyze')
    .addEdge('analyze', END)
    .compile()
}

export async function runDependencyAgent(
  rootPath: string,
  targetProgram?: string,
  options: AgentRunOptions = {},
): Promise<{ report: string | undefined; error: string | undefined }> {
  const graph = buildGraph(options)
  const result = await graph.invoke({ rootPath, targetProgram })
  return { report: result.report, error: result.error }
}
