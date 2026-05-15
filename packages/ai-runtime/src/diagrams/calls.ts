import type { CobolFile } from '@opencobol/shared'

function nodeId(name: string): string {
  return 'N_' + name.replace(/[-@#$]/g, '_')
}

export function generateCallsDiagram(file: CobolFile): string {
  const progName = file.programId ?? file.name.replace(/\.[^.]+$/, '')
  const mainId = nodeId(progName)

  const lines: string[] = ['graph LR']

  lines.push(`    ${mainId}["${progName}"]:::main`)
  lines.push('')

  if (file.calls.length === 0 && file.copybooks.length === 0) {
    lines.push(`    NONE["No external dependencies"]:::dim`)
  }

  for (const call of file.calls) {
    const id = nodeId('CALL_' + call)
    lines.push(`    ${id}(["${call}"]):::external`)
    lines.push(`    ${mainId} -->|CALL| ${id}`)
  }

  if (file.calls.length > 0 && file.copybooks.length > 0) lines.push('')

  for (const copy of file.copybooks) {
    const id = nodeId('COPY_' + copy)
    lines.push(`    ${id}[["${copy}"]]:::copybook`)
    lines.push(`    ${mainId} -.-|COPY| ${id}`)
  }

  lines.push('')
  lines.push('    classDef main fill:#00D4FF,color:#000,font-weight:bold,stroke:#0099bb')
  lines.push('    classDef external fill:#98FB98,stroke:#2d8a2d,color:#000')
  lines.push('    classDef copybook fill:#FFD700,stroke:#b8860b,color:#000')
  lines.push('    classDef dim fill:#eee,color:#aaa,stroke:#ccc')

  return `# Call Graph — ${progName}\n\n\`\`\`mermaid\n${lines.join('\n')}\n\`\`\`\n`
}
