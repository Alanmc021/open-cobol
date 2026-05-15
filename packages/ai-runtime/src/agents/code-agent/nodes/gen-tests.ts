import { ChatOpenAI } from '@langchain/openai'
import type { CodeAgentState } from '../state.js'
import { buildGenTestsPrompt } from '../prompts/gen-tests.js'
import type { GeneratedFile } from '../types.js'

export async function genTestsNode(
  state: CodeAgentState,
  llm?: ChatOpenAI,
): Promise<Partial<CodeAgentState>> {
  if (state.error || !state.cobolMetadata || state.businessRules.length === 0) return {}
  try {
    const model = llm ?? new ChatOpenAI({
      model: state.options?.model ?? 'gpt-4o',
      temperature: state.options?.temperature ?? 0,
    })
    const programId = (state.cobolMetadata.programId ?? state.cobolMetadata.name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')

    const prompt = buildGenTestsPrompt(programId, state.businessRules, state.targetLanguage)
    const response = await model.invoke(prompt)
    const content = response.content as string

    const ext = langExt(state.targetLanguage)
    const testFiles: GeneratedFile[] = [
      { path: `${programId}.test.${ext}`, content, language: state.targetLanguage },
    ]
    return { testFiles }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

function langExt(lang: string): string {
  const map: Record<string, string> = { typescript: 'ts', java: 'java', python: 'py', go: 'go' }
  return map[lang] ?? 'ts'
}
