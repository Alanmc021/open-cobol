import type { DataField } from '@opencobol/shared'

interface DataGroup {
  name: string
  level: number
  fields: DataField[]
}

function nodeId(name: string): string {
  return 'WS_' + name.replace(/[-]/g, '_')
}

function groupByLevel1(fields: DataField[]): DataGroup[] {
  const groups: DataGroup[] = []
  let current: DataGroup | null = null

  for (const f of fields) {
    if (f.name === 'FILLER') continue

    if (f.level === 1 || f.level === 77) {
      if (current) groups.push(current)
      current = { name: f.name, level: f.level, fields: [] }
    } else if (current && f.level <= 15 && f.pic) {
      current.fields.push(f)
    }
  }
  if (current) groups.push(current)

  return groups
}

export function generateDataDiagram(programId: string, wsFields: DataField[]): string {
  if (wsFields.length === 0) {
    return `# Data Structures — ${programId}\n\n_No WORKING-STORAGE fields found._\n`
  }

  const groups = groupByLevel1(wsFields)
  const withFields = groups.filter((g) => g.fields.length > 0).slice(0, 12)

  if (withFields.length === 0) {
    return `# Data Structures — ${programId}\n\n_No typed fields (PIC clauses) found in WORKING-STORAGE._\n`
  }

  const lines: string[] = ['classDiagram']

  for (const g of withFields) {
    const id = nodeId(g.name)
    const stereotype = g.level === 77 ? '<<independent>>' : '<<group>>'
    lines.push(`    class ${id} {`)
    lines.push(`        ${stereotype}`)
    for (const f of g.fields.slice(0, 10)) {
      const usage = f.usage ? ` [${f.usage}]` : ''
      lines.push(`        +${f.name} ${f.pic}${usage}`)
    }
    if (g.fields.length > 10) {
      lines.push(`        ... ${g.fields.length - 10} more fields`)
    }
    lines.push(`    }`)
  }

  const skipped = groups.length - withFields.length
  const note = skipped > 0 ? `\n> _${skipped} group(s) omitted (no PIC fields or limit reached)._` : ''

  return `# Data Structures — ${programId}\n\n\`\`\`mermaid\n${lines.join('\n')}\n\`\`\`${note}\n`
}
