import type { CobolFile, FlowResult } from '@opencobol/shared'
import type { BusinessRule } from '../types.js'

export function buildGenCodePrompt(
  file: CobolFile,
  sourceCode: string,
  flow: FlowResult | undefined,
  rules: BusinessRule[],
  targetLanguage: string,
): string {
  const rulesSection = JSON.stringify(rules, null, 2)
  const flowSection = flow
    ? `Entry point: ${flow.entryPoint ?? 'unknown'}\nParagraphs: ${flow.paragraphs.map((p) => p.name).join(', ')}`
    : 'Not available'

  const programId = file.programId ?? file.name.replace(/\.[^.]+$/, '')

  if (targetLanguage === 'typescript') {
    return `You are a senior TypeScript/NestJS engineer migrating a COBOL program.

## COBOL Program
- ID: ${programId}
- Lines: ${file.lines}
- Flow: ${flowSection}

## Business Rules to Implement
${rulesSection}

## Source Reference
\`\`\`cobol
${sourceCode}
\`\`\`

Generate a complete NestJS module with these files. Return a JSON object with this exact shape:
{
  "files": {
    "${programId.toLowerCase()}.dto.ts": "...full file content...",
    "${programId.toLowerCase()}.service.ts": "...full file content...",
    "${programId.toLowerCase()}.controller.ts": "...full file content...",
    "${programId.toLowerCase()}.module.ts": "...full file content..."
  }
}

Requirements:
- DTO: use class-validator decorators (@IsNumber, @IsString, etc.)
- Service: one method per business rule, named after rule.id in camelCase
- Controller: POST endpoints mapping to service methods, with @ApiOperation Swagger decorator
- Module: wire DTO, Service, Controller together
- Use strict TypeScript (no any, explicit return types)
- No imports from external packages beyond @nestjs/*, class-validator, class-transformer
- Return ONLY the JSON object, no markdown, no explanation`
  }

  if (targetLanguage === 'java') {
    return `You are a senior Java/Spring Boot engineer migrating a COBOL program.

## COBOL Program: ${programId}
## Business Rules
${rulesSection}
## Source Reference
\`\`\`cobol
${sourceCode}
\`\`\`

Return a JSON object:
{
  "files": {
    "src/main/java/${programId.toLowerCase()}/${toPascalCase(programId)}Dto.java": "...",
    "src/main/java/${programId.toLowerCase()}/${toPascalCase(programId)}Service.java": "...",
    "src/main/java/${programId.toLowerCase()}/${toPascalCase(programId)}Controller.java": "..."
  }
}

Requirements: Spring Boot 3, Java 21, use BigDecimal for monetary values, @RestController, @Service.
Return ONLY the JSON, no markdown.`
  }

  if (targetLanguage === 'python') {
    return `You are a senior Python/FastAPI engineer migrating a COBOL program.

## COBOL Program: ${programId}
## Business Rules
${rulesSection}
## Source Reference
\`\`\`cobol
${sourceCode}
\`\`\`

Return a JSON object:
{
  "files": {
    "${programId.toLowerCase()}_schemas.py": "...",
    "${programId.toLowerCase()}_service.py": "...",
    "${programId.toLowerCase()}_router.py": "..."
  }
}

Requirements: FastAPI, Pydantic v2, use Decimal for monetary values.
Return ONLY the JSON, no markdown.`
  }

  return `Migrate COBOL program ${programId} to ${targetLanguage}. Business rules: ${rulesSection}. Source: ${sourceCode}`
}

function toPascalCase(s: string): string {
  return s
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
}
