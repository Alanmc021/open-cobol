import { buildOrchestratorGraph } from './graph.js'
import type { AgentRunOptions } from '../types.js'

export async function runOrchestratorAgent(
  rootPath: string,
  options: AgentRunOptions = {},
): Promise<{ finalReport: string | undefined; error: string | undefined }> {
  const graph = buildOrchestratorGraph()
  const result = await graph.invoke({ rootPath, options })
  return { finalReport: result.finalReport, error: result.error }
}
