import type { CobolFile, FlowResult } from '@opencobol/shared'
import type { RetrievedContext } from '@opencobol/rag-engine'

export function buildExtractRulesPrompt(
  file: CobolFile,
  sourceCode: string,
  flow: FlowResult | undefined,
  ragContexts: RetrievedContext[],
): string {
  const flowSection = flow
    ? `\n## Execution Flow\nEntry point: ${flow.entryPoint ?? 'unknown'}\nParagraphs: ${flow.paragraphs.map((p) => p.name).join(', ')}\n`
    : ''

  const ragSection =
    ragContexts.length > 0
      ? `\n## Related Codebase Context\n${ragContexts.map((c) => c.formattedChunk).join('\n\n')}\n`
      : ''

  return `You are a senior COBOL analyst. Extract the business rules from the following COBOL program.

## Program
- ID: ${file.programId ?? file.name}
- Lines: ${file.lines}
- Copybooks: ${file.copybooks.join(', ') || 'none'}
- External calls: ${file.calls.join(', ') || 'none'}
${flowSection}${ragSection}
## Source Code
\`\`\`cobol
${sourceCode}
\`\`\`

Return a JSON object (no markdown, no explanation — only JSON) with this exact shape:
{
  "rules": [
    {
      "id": "RULE-ID-UPPERCASE",
      "name": "Human readable name",
      "description": "What this rule does in plain English",
      "sourceLocation": "PARAGRAPH-NAME or section name",
      "inputs": ["WS-FIELD-NAME"],
      "outputs": ["WS-RESULT-FIELD"],
      "invariants": ["output >= 0", "optional testable property"]
    }
  ]
}

Rules:
- One entry per distinct business rule (not per paragraph — a paragraph may contain multiple rules)
- Ignore infrastructure logic (file I/O setup, display output, program initialization)
- Focus on calculations, validations, and data transformations
- invariants must be simple boolean expressions suitable for unit test assertions
- Return at least one rule, even for simple programs`
}
