import type { GeneratedFile, ValidationResult } from '../types.js'

export function buildFixCodePrompt(
  sourceFiles: GeneratedFile[],
  testFiles: GeneratedFile[],
  validation: ValidationResult,
  targetLanguage: string,
): string {
  const errorsBlock = validation.errors.join('\n')
  const sourceBlock = sourceFiles
    .map((f) => `### ${f.path}\n\`\`\`${targetLanguage}\n${f.content}\n\`\`\``)
    .join('\n\n')
  const testBlock = testFiles
    .map((f) => `### ${f.path}\n\`\`\`${targetLanguage}\n${f.content}\n\`\`\``)
    .join('\n\n')

  return `You are a ${targetLanguage} engineer fixing compilation and test errors.

## Errors (${validation.failCount} of ${validation.testCount} tests failed)
\`\`\`
${errorsBlock}
\`\`\`

## Current Source Files
${sourceBlock}

## Test Files (do NOT modify these)
${testBlock}

Fix ALL errors in the source files. Return a JSON object with the same shape as before:
{
  "files": {
    "<filename>": "...corrected full content..."
  }
}

Rules:
- Include ALL source files in the response, even unchanged ones
- Do NOT modify test files
- Fix every error listed above
- Preserve all business logic — only fix compilation/type errors and test failures
- Return ONLY the JSON, no markdown, no explanation`
}
