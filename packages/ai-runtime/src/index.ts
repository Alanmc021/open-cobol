export { explainFile } from './explain.js'
export { buildExplainPrompt } from './prompts/explain.js'
export { OpenAIProvider } from './providers/openai.js'
export type { AIProvider, CompletionOptions, StreamChunk } from './providers/base.js'
export type { ExplainOptions, ExplainInput } from './explain.js'

export {
  runExplainerAgent,
  runDependencyAgent,
  runModernizationAgent,
  runDocsAgent,
} from './agents/index.js'
export type { AgentRunOptions, AgentOutput } from './agents/index.js'
