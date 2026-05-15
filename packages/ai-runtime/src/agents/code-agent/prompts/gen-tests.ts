import type { BusinessRule } from '../types.js'

export function buildGenTestsPrompt(
  programId: string,
  rules: BusinessRule[],
  targetLanguage: string,
): string {
  const rulesJson = JSON.stringify(rules, null, 2)

  if (targetLanguage === 'typescript') {
    return `You are a TypeScript test engineer. Generate Vitest unit tests for the following business rules extracted from a COBOL program.

## Program: ${programId}

## Business Rules
${rulesJson}

Generate a single TypeScript test file using Vitest. Requirements:
- Import the service as: import { ${toPascalCase(programId)}Service } from './${programId.toLowerCase()}.service.js'
- One \`describe\` block per business rule (use rule.name as the label)
- One \`it\` block per invariant in rule.invariants
- If no invariants, write at least one test that validates the described behavior
- Use \`expect\` assertions
- Do NOT import vitest — use the global API (describe, it, expect)
- Each test must call a real method on the service (e.g., service.calcNetPay({ grossPay: 1000, taxRate: 0.2 }))
- Method names should be camelCase derived from the rule.id

Return ONLY the TypeScript code, no markdown fences, no explanation.`
  }

  if (targetLanguage === 'java') {
    return `You are a Java test engineer. Generate JUnit 5 unit tests for the following business rules extracted from a COBOL program.

## Program: ${programId}

## Business Rules
${rulesJson}

Generate a single Java test class. Requirements:
- Class name: ${toPascalCase(programId)}ServiceTest
- One nested @Nested class per business rule
- One @Test method per invariant
- Use AssertJ (assertThat) for assertions
- Service class: ${toPascalCase(programId)}Service

Return ONLY the Java code, no markdown fences, no explanation.`
  }

  if (targetLanguage === 'python') {
    return `You are a Python test engineer. Generate pytest tests for the following business rules extracted from a COBOL program.

## Program: ${programId}

## Business Rules
${rulesJson}

Requirements:
- One test class per business rule
- One test method per invariant
- Import the service as: from ${programId.toLowerCase()}_service import ${toPascalCase(programId)}Service

Return ONLY the Python code, no markdown fences, no explanation.`
  }

  return `Generate unit tests for the following business rules from COBOL program ${programId} in ${targetLanguage}:
${rulesJson}`
}

function toPascalCase(s: string): string {
  return s
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
}
