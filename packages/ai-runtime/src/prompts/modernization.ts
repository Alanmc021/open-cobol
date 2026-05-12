import type { CobolFile } from '@opencobol/shared'
import type { FlowResult } from '@opencobol/shared'

export function buildModernizationPrompt(
  file: CobolFile,
  sourceCode: string,
  flow: FlowResult | undefined,
  targetLanguage: string,
): string {
  const flowSection = flow
    ? `\n## Execution Flow\nEntry point: ${flow.entryPoint ?? 'unknown'}\nParagraphs: ${flow.paragraphs.map((p) => p.name).join(', ')}\n`
    : ''

  const langLabel: Record<string, string> = {
    typescript: 'TypeScript (Node.js)',
    java: 'Java 21',
    python: 'Python 3.12',
    go: 'Go 1.22',
  }

  const targetLabel = langLabel[targetLanguage] ?? targetLanguage

  return `You are a senior software architect specializing in COBOL-to-modern migration.

## Source Program
- Program ID: ${file.programId ?? file.name}
- File: ${file.name}
- Lines: ${file.lines}
- Copybooks: ${file.copybooks.join(', ') || 'none'}
- External calls: ${file.calls.join(', ') || 'none'}
${flowSection}
## Source Code
\`\`\`cobol
${sourceCode}
\`\`\`

## Target: ${targetLabel}

Produce a practical modernization plan in Markdown with these sections:

### Executive Summary
One paragraph: what this program does and the overall modernization complexity (Low / Medium / High) with justification.

### COBOL → ${targetLabel} Mapping
A table mapping key COBOL constructs in this program to their modern equivalents:
| COBOL Construct | Modern Equivalent | Notes |

### Data Structures
Show the equivalent data classes/types for the key WORKING-STORAGE items.

### Core Logic Translation
For the 2-3 most complex paragraphs or business rules, provide:
- A brief description of what the COBOL does
- The equivalent ${targetLabel} code snippet

### External Integration Points
For each CALL and COPY dependency: what modern service/library/API would replace it?

### Migration Steps
Numbered checklist of concrete steps to replace this program, in order.

### Risks & Gotchas
3-5 specific COBOL behaviors (e.g., implicit decimal alignment, numeric overflow, file handling) that are easy to get wrong when migrating to ${targetLabel}.

Be specific to this program's actual code, not generic COBOL advice.`
}
