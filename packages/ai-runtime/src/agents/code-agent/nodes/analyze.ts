import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { analyzeFile, extractFlow } from '@opencobol/parser-core'
import type { CodeAgentState } from '../state.js'

export async function analyzeNode(state: CodeAgentState): Promise<Partial<CodeAgentState>> {
  try {
    const path = resolve(state.filePath)
    const cobolMetadata = analyzeFile(path)
    const cobolSource = readFileSync(path, 'utf-8')
    let flowResult = undefined
    try {
      flowResult = extractFlow(path)
    } catch {
      // flow extraction is best-effort
    }
    return { cobolMetadata, cobolSource, flowResult }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
