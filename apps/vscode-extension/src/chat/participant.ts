import * as vscode from 'vscode'
import { retrieve } from '@opencobol/rag-engine'
import { getConfig } from '../utils/config.js'

const SYSTEM_PROMPT = `You are OpenCobol AI, an expert assistant for legacy COBOL systems.
You help developers understand, document, and modernize COBOL codebases.
You answer questions based on COBOL code snippets retrieved via semantic search.
Be concise, technical, and accurate. Always reference specific paragraphs, programs, or variables when relevant.
Respond in the same language the user writes in.`

export function registerChatParticipant(context: vscode.ExtensionContext) {
  const participant = vscode.chat.createChatParticipant(
    'opencobol.chat',
    async (
      request: vscode.ChatRequest,
      _chatContext: vscode.ChatContext,
      stream: vscode.ChatResponseStream,
      token: vscode.CancellationToken,
    ) => {
      const { apiKey, model, qdrantUrl, qdrantCollection } = getConfig()

      if (!apiKey) {
        stream.markdown(
          '⚠️ **OpenAI API key not configured.**\n\nRun `opencobol init` in the terminal or add it in VS Code settings (`opencobol.openaiApiKey`).',
        )
        return
      }

      const query = request.prompt.trim()
      if (!query) {
        stream.markdown('Ask me anything about your COBOL codebase. Example: *"What does the PAYROLL program do?"*')
        return
      }

      stream.progress('Searching codebase…')

      let contextChunks: string[] = []
      let sourceFiles: string[] = []

      try {
        const results = await retrieve(query, {
          qdrantUrl,
          collection: qdrantCollection,
          topK: 5,
        })

        if (results.length > 0) {
          sourceFiles = [...new Set(results.map((r) => r.hit.payload.file))]
          contextChunks = results.map((r) => r.formattedChunk)
        }
      } catch {
        // Qdrant not available — answer without context
      }

      if (token.isCancellationRequested) return

      stream.progress('Generating answer…')

      const contextBlock =
        contextChunks.length > 0
          ? `\n\nRelevant COBOL code:\n\`\`\`\n${contextChunks.join('\n\n---\n\n')}\n\`\`\``
          : '\n\nNo indexed code found. Run "OpenCobol: Index Workspace" first for better answers.'

      const messages = [
        vscode.LanguageModelChatMessage.User(`${SYSTEM_PROMPT}${contextBlock}\n\nQuestion: ${query}`),
      ]

      try {
        const [model3_5] = await vscode.lm.selectChatModels({ family: 'gpt-4o' })

        if (model3_5) {
          // Use VS Code's built-in LM API (Copilot)
          const response = await model3_5.sendRequest(messages, {}, token)
          for await (const chunk of response.text) {
            stream.markdown(chunk)
          }
        } else {
          // Fallback: use OpenAI directly
          await streamWithOpenAI(query, contextChunks, apiKey, model, stream, token)
        }

        if (sourceFiles.length > 0) {
          stream.markdown(`\n\n---\n*Context from: ${sourceFiles.join(', ')}*`)
        }
      } catch (err) {
        await streamWithOpenAI(query, contextChunks, apiKey, model, stream, token)
        if (sourceFiles.length > 0) {
          stream.markdown(`\n\n---\n*Context from: ${sourceFiles.join(', ')}*`)
        }
      }
    },
  )

  participant.iconPath = new vscode.ThemeIcon('database')
  context.subscriptions.push(participant)
}

async function streamWithOpenAI(
  query: string,
  contextChunks: string[],
  apiKey: string,
  model: string,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
) {
  const contextBlock =
    contextChunks.length > 0
      ? `\n\nRelevant COBOL code:\n\`\`\`\n${contextChunks.join('\n\n---\n\n')}\n\`\`\``
      : ''

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${contextBlock}\n\nQuestion: ${query}` },
      ],
    }),
    signal: token.isCancellationRequested ? AbortSignal.abort() : undefined,
  })

  if (!response.ok || !response.body) {
    throw new Error(`OpenAI error: ${response.statusText}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (token.isCancellationRequested) break

    const text = decoder.decode(value)
    for (const line of text.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') break
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) stream.markdown(delta)
      } catch {}
    }
  }
}
