import { ChatOpenAI } from '@langchain/openai'
import type { CobolFile } from '@opencobol/shared'
import type { FlowResult } from '@opencobol/shared'
import type { AgentRunOptions } from './types.js'

function buildArchPrompt(file: CobolFile, flow: FlowResult | null, source: string): string {
  const progName = file.programId ?? file.name.replace(/\.[^.]+$/, '')
  const paraList = flow?.paragraphs.map((p) => p.name).join(', ') ?? 'unknown'
  const callList = file.calls.join(', ') || 'none'
  const copyList = file.copybooks.join(', ') || 'none'

  return `You are a software architect creating an architecture overview diagram for a COBOL program.

Generate a Mermaid flowchart diagram (use "flowchart TD" syntax) that shows:
- The program as the central component
- Key processing phases (not individual paragraphs — group them semantically)
- External systems/programs it calls
- Data inputs and outputs it accesses
- The general data flow at a high level

## Program Info
- Name: ${progName}
- External calls: ${callList}
- Copybooks: ${copyList}
- Paragraphs: ${paraList}

## Source (first 3000 chars)
\`\`\`cobol
${source.slice(0, 3000)}
\`\`\`

Rules:
- Use flowchart TD syntax only
- Keep it high-level (5–12 nodes max)
- Node IDs must be simple alphanumeric (no dashes)
- Include classDef styles
- Return ONLY the Mermaid code block — no explanations, no text before or after`
}

export async function generateArchDiagram(
  file: CobolFile,
  source: string,
  flow: FlowResult | null,
  options: AgentRunOptions = {},
): Promise<string> {
  const llm = new ChatOpenAI({
    model: options.model ?? 'gpt-4o',
    temperature: 0,
  })

  const response = await llm.invoke(buildArchPrompt(file, flow, source))
  const content = response.content as string

  const progName = file.programId ?? file.name.replace(/\.[^.]+$/, '')

  // Strip any extra prose the LLM might have added
  const mermaidMatch = content.match(/```(?:mermaid)?\s*([\s\S]+?)\s*```/)
  const diagram = mermaidMatch ? mermaidMatch[1]!.trim() : content.trim()

  return `# Architecture Diagram — ${progName}\n\n\`\`\`mermaid\n${diagram}\n\`\`\`\n`
}
