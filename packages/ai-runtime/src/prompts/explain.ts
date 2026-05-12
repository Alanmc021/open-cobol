import type { CobolFile } from '@opencobol/shared'

export function buildExplainPrompt(file: CobolFile, sourceCode: string): string {
  const copybookList =
    file.copybooks.length > 0 ? file.copybooks.join(', ') : 'None'
  const callList = file.calls.length > 0 ? file.calls.join(', ') : 'None'

  return `You are an expert COBOL analyst with deep knowledge of legacy mainframe systems, enterprise business logic, and software modernization.

Analyze the following COBOL program and provide a clear, structured explanation aimed at a modern software engineer who is not familiar with COBOL.

## Program Metadata
- Program ID: ${file.programId ?? file.name}
- File: ${file.name}
- Lines of code: ${file.lines}
- Copybooks (shared data structures): ${copybookList}
- External calls (subroutines/services): ${callList}

## Source Code
\`\`\`cobol
${sourceCode}
\`\`\`

Provide a structured analysis with these sections:

### Purpose
One clear sentence describing what this program does from a business perspective.

### Business Rules
List the key business rules and logic implemented, numbered and explained in plain language.

### Data Flow
Describe how data enters, is processed, and exits the program. Mention key variables and their roles.

### External Dependencies
For each copybook and external CALL, explain its likely purpose based on context clues in the code.

### Modernization Notes
3-5 key considerations a developer should know when rewriting this program in a modern language (Node.js, Java, Python).

Keep explanations concise and practical. Avoid COBOL jargon without explanation.`
}
