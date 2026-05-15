import 'dotenv/config'
import 'reflect-metadata'
import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'

function applyFileConfig() {
  const path = join(homedir(), '.opencobol', 'config.json')
  if (!existsSync(path)) return
  try {
    const c = JSON.parse(readFileSync(path, 'utf-8'))
    if (c.openaiApiKey && !process.env['OPENAI_API_KEY']) process.env['OPENAI_API_KEY'] = c.openaiApiKey
    if (c.model && !process.env['OPENAI_MODEL']) process.env['OPENAI_MODEL'] = c.model
    if (c.qdrantUrl && !process.env['QDRANT_URL']) process.env['QDRANT_URL'] = c.qdrantUrl
    if (c.qdrantCollection && !process.env['QDRANT_COLLECTION']) process.env['QDRANT_COLLECTION'] = c.qdrantCollection
    if (c.langsmithApiKey && !process.env['LANGCHAIN_API_KEY']) {
      process.env['LANGCHAIN_API_KEY'] = c.langsmithApiKey
      process.env['LANGCHAIN_TRACING_V2'] = 'true'
      process.env['LANGCHAIN_PROJECT'] = c.langsmithProject ?? 'opencobol-ai'
    }
  } catch {}
}

async function bootstrap() {
  applyFileConfig()

  const app = await NestFactory.create(AppModule, { cors: true })
  app.setGlobalPrefix('api')

  const port = process.env['PORT'] ?? 3001
  await app.listen(port)
  console.log(`OpenCobol API → http://localhost:${port}/api`)
}

bootstrap()
