import type { ScanResult, CallDependency, CopybookDependency } from '@opencobol/shared'

export function buildDependencyPrompt(
  scan: ScanResult,
  callDeps: CallDependency[],
  copybookDeps: CopybookDependency[],
  targetProgram?: string,
): string {
  const programList = scan.files
    .filter((f) => f.type === 'program')
    .map((f) => `- ${f.programId ?? f.name} (${f.lines} lines, calls: ${f.calls.join(', ') || 'none'})`)
    .join('\n')

  const callGraph = callDeps
    .map((d) => `- ${d.target}: called by ${d.calledBy.map((c) => c.file).join(', ')}`)
    .join('\n')

  const copybookGraph = copybookDeps
    .map((d) => `- ${d.copybook}: used by ${d.usedBy.join(', ')}`)
    .join('\n')

  const focusSection = targetProgram
    ? `\n## Focus Program\nAnalyze the specific impact of changing **${targetProgram}**. Which programs would be affected? What risks exist?\n`
    : ''

  return `You are a COBOL systems analyst specializing in legacy modernization and dependency analysis.

## Codebase Overview
- Total programs: ${scan.stats.programs}
- Total copybooks: ${scan.stats.copybooks}
- Total lines: ${scan.stats.totalLines.toLocaleString()}

## Programs
${programList || 'None found'}

## Call Graph (who calls whom)
${callGraph || 'No inter-program calls detected'}

## Copybook Dependencies (shared data structures)
${copybookGraph || 'No copybooks detected'}
${focusSection}
Generate a concise dependency analysis report in Markdown with these sections:

### Summary
One paragraph describing the overall system structure and coupling level.

### High-Risk Components
List programs or copybooks that, if changed, would ripple through the most other components. Explain why each is high-risk.

### Isolated Components
Programs that can be modified or replaced with minimal downstream risk.

### Modernization Order
Recommended sequence for migrating programs to modern languages, starting with the safest candidates.

### Key Risks
3-5 specific risks a team should address before starting modernization.

Be direct and actionable. Assume the audience is a senior engineer planning a migration project.`
}
