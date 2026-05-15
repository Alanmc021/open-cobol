import { Annotation } from '@langchain/langgraph'
import type { ScanResult, CallDependency, CopybookDependency } from '@opencobol/shared'
import type { AgentRunOptions } from '../types.js'

export const OrchestratorAnnotation = Annotation.Root({
  rootPath: Annotation<string>(),
  scanResult: Annotation<ScanResult | undefined>(),
  callDeps: Annotation<CallDependency[] | undefined>(),
  copybookDeps: Annotation<CopybookDependency[] | undefined>(),
  dependencyReport: Annotation<string | undefined>(),
  explanations: Annotation<Array<{ file: string; explanation: string }> | undefined>(),
  finalReport: Annotation<string | undefined>(),
  error: Annotation<string | undefined>(),
  options: Annotation<AgentRunOptions | undefined>(),
})

export type OrchestratorState = typeof OrchestratorAnnotation.State
