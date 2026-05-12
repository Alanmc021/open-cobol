import type { CobolFile } from '@opencobol/shared'
import type { FlowResult } from '@opencobol/shared'

export function buildDocsPrompt(
  file: CobolFile,
  sourceCode: string,
  flow: FlowResult | undefined,
): string {
  const flowSection = flow
    ? `\n## Paragraphs\n${flow.paragraphs.map((p) => `- **${p.name}** (lines ${p.lineStart}–${p.lineEnd}): performs [${p.performs.join(', ') || 'none'}], calls [${p.calls.join(', ') || 'none'}]`).join('\n')}\n`
    : ''

  return `You are a technical writer generating production-quality documentation for a legacy COBOL program.

## Program Metadata
- Program ID: ${file.programId ?? file.name}
- File: ${file.name}
- Type: ${file.type}
- Lines: ${file.lines}
- Size: ${Math.round(file.sizeBytes / 1024)}KB
- Copybooks: ${file.copybooks.join(', ') || 'none'}
- External calls: ${file.calls.join(', ') || 'none'}
${flowSection}
## Source Code
\`\`\`cobol
${sourceCode}
\`\`\`

Generate complete Markdown documentation with these sections:

# [Program Name]

## Overview
2-3 sentences describing the program's business purpose.

## Business Context
What business process does this program support? Who uses it and when?

## Inputs & Outputs
| Name | Type | Direction | Description |

## Business Rules
Numbered list of all business rules implemented, in plain language.

## Data Dictionary
Key WORKING-STORAGE variables and their purpose:
| Variable | COBOL Type | Purpose |

## Control Flow
\`\`\`mermaid
flowchart TD
    [Generate a Mermaid flowchart showing the main execution path through paragraphs]
\`\`\`

## Dependencies
### Copybooks
For each copybook: what data structures it provides.

### External Programs (CALL)
For each called program: its likely purpose based on context.

## Maintenance Notes
- Known quirks or edge cases visible in the code
- Areas most likely to need changes for business rule updates

## Change Log
| Date | Author | Change |
|------|--------|--------|
| TBD  | —      | Initial documentation generated |

Write documentation that a developer unfamiliar with COBOL can understand and act on.`
}
