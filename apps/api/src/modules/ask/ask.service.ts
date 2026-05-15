import { Injectable } from '@nestjs/common'
import { retrieve, buildRagPrompt } from '@opencobol/rag-engine'
import { Observable, Subscriber } from 'rxjs'

export interface AskOptions {
  question: string
  qdrantUrl?: string
  collection?: string
  topK?: number
  model?: string
}

@Injectable()
export class AskService {
  streamAnswer(opts: AskOptions): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      this.run(opts, subscriber).catch((err: Error) => {
        subscriber.next({ data: JSON.stringify({ type: 'error', message: err.message }) } as MessageEvent)
        subscriber.complete()
      })
    })
  }

  private async run(opts: AskOptions, subscriber: Subscriber<MessageEvent>) {
    const {
      question,
      qdrantUrl,
      collection,
      topK = 5,
      model = process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini',
    } = opts

    const emit = (data: object) =>
      subscriber.next({ data: JSON.stringify(data) } as MessageEvent)

    emit({ type: 'status', message: 'Searching codebase…' })

    const results = await retrieve(question, {
      qdrantUrl: qdrantUrl ?? process.env['QDRANT_URL'] ?? 'http://localhost:6333',
      collection: collection ?? process.env['QDRANT_COLLECTION'] ?? 'opencobol',
      topK,
    })

    const sourceFiles = [...new Set(results.map((r) => r.hit.payload.file))]
    const prompt = buildRagPrompt(question, results)

    emit({ type: 'sources', files: sourceFiles })
    emit({ type: 'status', message: 'Generating answer…' })

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env['OPENAI_API_KEY']}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          {
            role: 'system',
            content:
              'You are OpenCobol AI, an expert in legacy COBOL systems. Answer based on the provided code context. Respond in the same language the user writes in.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`OpenAI error: ${response.statusText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value)
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') break
        try {
          const json = JSON.parse(raw)
          const delta = json.choices?.[0]?.delta?.content
          if (delta) emit({ type: 'token', content: delta })
        } catch {}
      }
    }

    emit({ type: 'done' })
    subscriber.complete()
  }
}
