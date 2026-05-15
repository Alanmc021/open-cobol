import { Annotation } from '@langchain/langgraph'
import type { CobolFile, FlowResult } from '@opencobol/shared'
import type { RetrievedContext } from '@opencobol/rag-engine'
import type { BusinessRule, CodeAgentOptions, GeneratedFile, ValidationResult } from './types.js'

export const CodeAgentAnnotation = Annotation.Root({
  filePath: Annotation<string>(),
  targetLanguage: Annotation<string>(),
  outputDir: Annotation<string>(),
  options: Annotation<CodeAgentOptions | undefined>(),
  cobolMetadata: Annotation<CobolFile | undefined>(),
  cobolSource: Annotation<string | undefined>(),
  flowResult: Annotation<FlowResult | undefined>(),
  ragContexts: Annotation<RetrievedContext[]>({ value: (_a, b) => b, default: () => [] }),
  businessRules: Annotation<BusinessRule[]>({ value: (_a, b) => b, default: () => [] }),
  testFiles: Annotation<GeneratedFile[]>({ value: (_a, b) => b, default: () => [] }),
  sourceFiles: Annotation<GeneratedFile[]>({ value: (_a, b) => b, default: () => [] }),
  validationResult: Annotation<ValidationResult | undefined>(),
  iteration: Annotation<number>({ value: (_a, b) => b, default: () => 0 }),
  writtenPaths: Annotation<string[]>({ value: (_a, b) => b, default: () => [] }),
  error: Annotation<string | undefined>(),
})

export type CodeAgentState = typeof CodeAgentAnnotation.State
