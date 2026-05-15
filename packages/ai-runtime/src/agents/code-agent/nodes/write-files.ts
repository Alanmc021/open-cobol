import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { interrupt } from '@langchain/langgraph'
import type { CodeAgentState } from '../state.js'

export async function writeFilesNode(state: CodeAgentState): Promise<Partial<CodeAgentState>> {
  if (state.error) return {}

  const allFiles = [...state.sourceFiles, ...state.testFiles]

  if (!state.options?.autoApprove) {
    interrupt({
      type: 'approval',
      files: allFiles.map((f) => f.path),
      message: 'Approve writing these files to disk?',
    })
  }

  const outputDir = resolve(state.outputDir)
  const writtenPaths: string[] = []

  for (const file of allFiles) {
    const dest = join(outputDir, file.path)
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, file.content, 'utf-8')
    writtenPaths.push(dest)
  }

  return { writtenPaths }
}
