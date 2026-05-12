export interface AgentRunOptions {
  model?: string
  temperature?: number
}

export interface AgentOutput<T> {
  result: T | undefined
  error: string | undefined
}
