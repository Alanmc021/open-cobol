import type { FlowResult } from '@opencobol/shared'

function nodeId(name: string): string {
  return 'N_' + name.replace(/[-@#$]/g, '_')
}

export function generateFlowDiagram(flow: FlowResult): string {
  const { programId, entryPoint, paragraphs } = flow
  const title = programId ?? flow.fileName.replace(/\.[^.]+$/, '')

  const paraSet = new Set(paragraphs.map((p) => p.name))

  // Collect external calls (CALL targets that are not paragraphs in this program)
  const externalCalls = new Set<string>()
  for (const p of paragraphs) {
    for (const c of p.calls) {
      if (!paraSet.has(c)) externalCalls.add(c)
    }
  }

  const lines: string[] = ['flowchart TD']

  // Paragraph nodes — limit to 40 for readability
  const shown = paragraphs.slice(0, 40)
  for (const p of shown) {
    const id = nodeId(p.name)
    if (p.name === entryPoint) {
      lines.push(`    ${id}["${p.name}"]:::entry`)
    } else if (/ABEND|ERROR|ABORT/i.test(p.name)) {
      lines.push(`    ${id}["${p.name}"]:::error`)
    } else if (/CLOSE|END|EXIT/i.test(p.name)) {
      lines.push(`    ${id}["${p.name}"]:::close`)
    } else {
      lines.push(`    ${id}["${p.name}"]`)
    }
  }
  if (paragraphs.length > 40) {
    lines.push(`    TRUNCATED["... ${paragraphs.length - 40} more paragraphs"]:::dim`)
  }

  // External call nodes
  for (const ext of externalCalls) {
    lines.push(`    ${nodeId('EXT_' + ext)}[/"${ext}"/]:::external`)
  }

  lines.push('')

  // Edges
  const shownNames = new Set(shown.map((p) => p.name))
  for (const p of shown) {
    for (const target of p.performs) {
      if (shownNames.has(target)) {
        lines.push(`    ${nodeId(p.name)} --> ${nodeId(target)}`)
      }
    }
    for (const call of p.calls) {
      if (!paraSet.has(call)) {
        lines.push(`    ${nodeId(p.name)} -.-> ${nodeId('EXT_' + call)}`)
      }
    }
  }

  lines.push('')
  lines.push('    classDef entry fill:#00D4FF,color:#000,font-weight:bold,stroke:#0099bb')
  lines.push('    classDef external fill:#f5f5f5,stroke:#999,stroke-dasharray:5 5')
  lines.push('    classDef error fill:#ff6b6b,color:#fff,stroke:#cc0000')
  lines.push('    classDef close fill:#b0c4de,color:#000,stroke:#708090')
  lines.push('    classDef dim fill:#eee,color:#aaa,stroke:#ccc')

  return `# Flow Diagram — ${title}\n\n\`\`\`mermaid\n${lines.join('\n')}\n\`\`\`\n`
}
