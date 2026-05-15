export interface StreamChunk {
  text: string
  done: boolean
}

export interface CompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIProvider {
  streamCompletion(
    prompt: string,
    options?: CompletionOptions,
  ): AsyncIterable<StreamChunk>

  streamChat(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): AsyncIterable<StreamChunk>
}
