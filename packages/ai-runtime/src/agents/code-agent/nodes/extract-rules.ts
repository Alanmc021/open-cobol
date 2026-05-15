import { ChatOpenAI } from '@langchain/openai'
import type { CodeAgentState } from '../state.js'
import { buildExtractRulesPrompt } from '../prompts/extract-rules.js'
import type { BusinessRule } from '../types.js'

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

export async function extractRulesNode(
  state: CodeAgentState,
  llm?: ChatOpenAI,
): Promise<Partial<CodeAgentState>> {
  if (state.error || !state.cobolMetadata || !state.cobolSource) return {}
  try {
    const model = llm ?? new ChatOpenAI({
      model: state.options?.model ?? 'gpt-4o',
      temperature: state.options?.temperature ?? 0,
    })
    const prompt = buildExtractRulesPrompt(
      state.cobolMetadata,
      state.cobolSource,
      state.flowResult,
      state.ragContexts,
    )
    const response = await model.invoke(prompt)
    const parsed = extractJson(response.content as string) as { rules: BusinessRule[] }
    return { businessRules: parsed.rules ?? [] }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
