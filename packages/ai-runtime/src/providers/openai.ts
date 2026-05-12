import OpenAI from 'openai'
import type { AIProvider, CompletionOptions, StreamChunk } from './base.js'

export class OpenAIProvider implements AIProvider {
  private client: OpenAI

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey ?? process.env['OPENAI_API_KEY'] })
  }

  async *streamCompletion(
    prompt: string,
    options: CompletionOptions = {},
  ): AsyncIterable<StreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: options.model ?? 'gpt-4o',
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 2048,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? ''
      const done = chunk.choices[0]?.finish_reason === 'stop'
      if (text) yield { text, done: false }
      if (done) yield { text: '', done: true }
    }
  }
}
