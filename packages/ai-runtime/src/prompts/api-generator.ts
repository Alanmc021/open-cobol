import type { CobolFile } from '@opencobol/shared'
import type { FlowResult } from '@opencobol/shared'

export function buildApiGeneratorPrompt(
  file: CobolFile,
  sourceCode: string,
  flow: FlowResult | undefined,
  framework: string,
): string {
  const flowSection = flow
    ? `\nExecution flow — entry: ${flow.entryPoint ?? 'unknown'}, paragraphs: ${flow.paragraphs.map((p) => p.name).join(' → ')}\n`
    : ''

  return `You are a senior software architect. Convert the COBOL program below into a production-ready ${framework} REST API.

## COBOL Program
- Program ID: ${file.programId ?? file.name}
- Lines: ${file.lines}
- Copybooks: ${file.copybooks.join(', ') || 'none'}
- External calls: ${file.calls.join(', ') || 'none'}
${flowSection}
\`\`\`cobol
${sourceCode}
\`\`\`

## Output Requirements
Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:

{
  "programName": "<lowercase program name, e.g. payroll>",
  "description": "<one sentence describing what this API does>",
  "endpoints": [
    {
      "method": "POST|GET|PUT|DELETE",
      "path": "/<resource>/<action>",
      "description": "<what this endpoint does>"
    }
  ],
  "files": {
    "<name>.dto.ts": "<full TypeScript NestJS DTO file content>",
    "<name>.service.ts": "<full TypeScript NestJS service file content>",
    "<name>.controller.ts": "<full TypeScript NestJS controller file content>",
    "<name>.module.ts": "<full TypeScript NestJS module file content>"
  }
}

## Rules
- Map each major COBOL paragraph (or logical group) to a REST endpoint
- Map WORKING-STORAGE numeric fields to TypeScript number types
- Map WORKING-STORAGE string/alphanumeric fields to string types
- Replace COBOL CALL targets with injected NestJS services (stub them with TODO comments)
- COPY dependencies become comments referencing the shared types
- Use class-validator decorators in DTOs (@IsNumber, @IsString, @IsOptional, etc.)
- Use @nestjs/common decorators (@Controller, @Post, @Get, @Body, @Injectable, etc.)
- Use @nestjs/swagger decorators (@ApiProperty, @ApiOperation, @ApiResponse)
- Keep logic faithful to the original COBOL business rules
- Add JSDoc comments explaining each method's COBOL origin`
}
