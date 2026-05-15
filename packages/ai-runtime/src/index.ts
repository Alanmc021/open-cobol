export { explainFile } from './explain.js'
export { generateFlowDiagram } from './diagrams/flow.js'
export { generateCallsDiagram } from './diagrams/calls.js'
export { generateDataDiagram } from './diagrams/data.js'
export { generateArchDiagram } from './agents/diagram.js'
export { buildExplainPrompt } from './prompts/explain.js'
export { OpenAIProvider } from './providers/openai.js'
export type { AIProvider, ChatMessage, CompletionOptions, StreamChunk } from './providers/base.js'
export type { ExplainOptions, ExplainInput } from './explain.js'

export {
  runExplainerAgent,
  runDependencyAgent,
  runModernizationAgent,
  runDocsAgent,
  runApiGeneratorAgent,
  runCodeAgent,
  streamCodeAgent,
  runOrchestratorAgent,
  NODE_LABELS,
} from './agents/index.js'
export type {
  AgentRunOptions,
  AgentOutput,
  GeneratedApi,
  GeneratedEndpoint,
  CodeAgentInput,
  CodeAgentOptions,
  BusinessRule,
  GeneratedFile,
  ValidationResult,
  AgentPhase,
} from './agents/index.js'
