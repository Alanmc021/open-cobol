import { ChatOpenAI } from '@langchain/openai'
import type { CodeAgentState } from '../state.js'
import { buildFixCodePrompt } from '../prompts/fix-code.js'
import type { GeneratedFile } from '../types.js'

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {}
  const block = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
  if (block?.[1]) {
    try { return JSON.parse(block[1]) } catch {}
  }
  const brace = text.match(/\{[\s\S]+\}/)
  if (brace?.[0]) return JSON.parse(brace[0])
  throw new Error('Could not extract JSON from LLM response')
}

export async function fixCodeNode(
  state: CodeAgentState,
  llm?: ChatOpenAI,
): Promise<Partial<CodeAgentState>> {
  if (state.error || !state.validationResult) return {}
  try {
    const model = llm ?? new ChatOpenAI({
      model: state.options?.model ?? 'gpt-4o',
      temperature: state.options?.temperature ?? 0,
    })
    const prompt = buildFixCodePrompt(
      state.sourceFiles,
      state.testFiles,
      state.validationResult,
      state.targetLanguage,
    )
    const response = await model.invoke(prompt)
    const parsed = extractJson(response.content as string) as { files: Record<string, string> }
    const sourceFiles: GeneratedFile[] = Object.entries(parsed.files ?? {}).map(([path, content]) => ({
      path,
      content,
      language: state.targetLanguage,
    }))
    return { sourceFiles, iteration: state.iteration + 1 }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
