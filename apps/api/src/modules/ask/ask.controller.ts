import { Controller, Post, Body, Sse, MessageEvent, UseGuards } from '@nestjs/common'
import { AskService } from './ask.service.js'
import { Observable } from 'rxjs'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../../auth/guards/roles.guard.js'
import { Roles } from '../../auth/decorators/roles.decorator.js'

export class AskDto {
  question!: string
  qdrantUrl?: string
  collection?: string
  topK?: number
  model?: string
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ask')
export class AskController {
  constructor(private readonly askService: AskService) {}

  @Roles('ANALYST')
  @Sse('stream')
  @Post('stream')
  stream(@Body() dto: AskDto): Observable<MessageEvent> {
    return this.askService.streamAnswer(dto)
  }

  @Roles('ANALYST')
  @Post()
  async ask(@Body() dto: AskDto) {
    const tokens: string[] = []
    let sources: string[] = []

    for await (const event of toAsyncIterable(this.askService.streamAnswer(dto))) {
      const parsed = JSON.parse((event as MessageEvent).data as string)
      if (parsed.type === 'token') tokens.push(parsed.content)
      if (parsed.type === 'sources') sources = parsed.files
    }

    return { answer: tokens.join(''), sources }
  }
}

async function* toAsyncIterable<T>(obs: Observable<T>): AsyncIterable<T> {
  const queue: T[] = []
  let done = false
  let error: unknown

  obs.subscribe({
    next: (v) => queue.push(v),
    error: (e) => { error = e; done = true },
    complete: () => { done = true },
  })

  while (!done || queue.length > 0) {
    if (queue.length > 0) {
      yield queue.shift()!
    } else {
      await new Promise((r) => setTimeout(r, 10))
    }
  }

  if (error) throw error
}
