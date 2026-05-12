export interface StreamChunk {
  text: string
  done: boolean
}

export interface CompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface AIProvider {
  streamCompletion(
    prompt: string,
    options?: CompletionOptions,
  ): AsyncIterable<StreamChunk>
}
