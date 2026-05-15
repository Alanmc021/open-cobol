import { END, START, StateGraph } from '@langchain/langgraph'
import {
  scanDirectory,
  buildCallDependencies,
  buildCopybookDependencies,
} from '@opencobol/parser-core'
import { runExplainerAgent } from '../explainer.js'
import { runDependencyAgent } from '../dependency.js'
import { OrchestratorAnnotation, type OrchestratorState } from './state.js'

const MAX_EXPLAIN_FILES = 5

async function scanNode(
  state: OrchestratorState,
): Promise<Partial<OrchestratorState>> {
  try {
    const scanResult = await scanDirectory(state.rootPath)
    const callDeps = buildCallDependencies(scanResult.files)
    const copybookDeps = buildCopybookDependencies(scanResult.files)
    return { scanResult, callDeps, copybookDeps }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

async function dependencyNode(
  state: OrchestratorState,
): Promise<Partial<OrchestratorState>> {
  if (state.error || !state.scanResult) return {}
  try {
    const { report } = await runDependencyAgent(state.rootPath, undefined, state.options ?? {})
    return { dependencyReport: report }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

async function explainNode(
  state: OrchestratorState,
): Promise<Partial<OrchestratorState>> {
  if (state.error || !state.scanResult) return {}
  try {
    const programs = state.scanResult.files
      .filter((f) => f.type === 'program')
      .slice(0, MAX_EXPLAIN_FILES)

    const explanations: Array<{ file: string; explanation: string }> = []
    for (const program of programs) {
      const { explanation } = await runExplainerAgent(program.path, state.options ?? {})
      if (explanation) {
        explanations.push({ file: program.name, explanation })
      }
    }
    return { explanations }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

function docsNode(state: OrchestratorState): Partial<OrchestratorState> {
  if (state.error || !state.scanResult) return {}

  const { scanResult, callDeps, copybookDeps, dependencyReport, explanations } = state
  const { stats } = scanResult

  const lines: string[] = []

  lines.push('# OpenCobol Analysis Report')
  lines.push('')
  lines.push(`**Root:** \`${scanResult.rootPath}\``)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push(`| Type | Count |`)
  lines.push(`|---|---|`)
  lines.push(`| Programs | ${stats.programs} |`)
  lines.push(`| Copybooks | ${stats.copybooks} |`)
  lines.push(`| JCL | ${stats.jcl} |`)
  lines.push(`| Total lines | ${stats.totalLines.toLocaleString()} |`)
  lines.push('')

  lines.push('## Programs Found')
  lines.push('')
  const programs = scanResult.files.filter((f) => f.type === 'program')
  for (const p of programs) {
    const calls = p.calls.length > 0 ? ` — calls: ${p.calls.join(', ')}` : ''
    const copies = p.copybooks.length > 0 ? ` — copies: ${p.copybooks.join(', ')}` : ''
    lines.push(`- **${p.programId ?? p.name}** (\`${p.name}\`, ${p.lines} lines)${calls}${copies}`)
  }
  lines.push('')

  if (callDeps && callDeps.length > 0) {
    lines.push('## Call Dependencies')
    lines.push('')
    for (const dep of callDeps) {
      const callers = dep.calledBy.map((c) => c.file).join(', ')
      lines.push(`- \`${dep.target}\` ← called by: ${callers}`)
    }
    lines.push('')
  }

  if (copybookDeps && copybookDeps.length > 0) {
    lines.push('## Copybook Usage')
    lines.push('')
    for (const dep of copybookDeps) {
      lines.push(`- \`${dep.copybook}\` ← used by: ${dep.usedBy.join(', ')}`)
    }
    lines.push('')
  }

  if (dependencyReport) {
    lines.push('## Dependency Analysis (AI)')
    lines.push('')
    lines.push(dependencyReport)
    lines.push('')
  }

  if (explanations && explanations.length > 0) {
    lines.push('## Program Explanations')
    lines.push('')
    for (const { file, explanation } of explanations) {
      lines.push(`### ${file}`)
      lines.push('')
      lines.push(explanation)
      lines.push('')
    }
  }

  return { finalReport: lines.join('\n') }
}

export function buildOrchestratorGraph() {
  return new StateGraph(OrchestratorAnnotation)
    .addNode('scan', scanNode)
    .addNode('dependency', dependencyNode)
    .addNode('explain', explainNode)
    .addNode('docs', docsNode)
    .addEdge(START, 'scan')
    .addEdge('scan', 'dependency')
    .addEdge('dependency', 'explain')
    .addEdge('explain', 'docs')
    .addEdge('docs', END)
    .compile()
}
