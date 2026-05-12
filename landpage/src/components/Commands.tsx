const commands = [
  { cmd: 'init', desc: 'Configure API key, Qdrant endpoint and project settings', phase: 'Setup' },
  { cmd: 'scan', desc: 'Detect COBOL files, parse COPY statements and map call graph', phase: 'Analysis' },
  { cmd: 'flow', desc: 'Show execution flow of a program in readable textual form', phase: 'Analysis' },
  { cmd: 'embed', desc: 'Chunk, embed and index the codebase into Qdrant', phase: 'RAG' },
  { cmd: 'ask', desc: 'Semantic chat — ask any question about your system', phase: 'RAG' },
  { cmd: 'explain', desc: 'AI explanation of a single file with business rules', phase: 'AI' },
  { cmd: 'deps', desc: 'Generate dependency graph across all programs', phase: 'AI' },
  { cmd: 'generate-docs', desc: 'Output full Markdown documentation for a program or project', phase: 'AI' },
  { cmd: 'modernize', desc: 'Generate migration plan to a modern language', phase: 'AI' },
  { cmd: 'architecture', desc: 'Produce high-level architecture diagram from static analysis', phase: 'AI' },
]

const phaseColor: Record<string, string> = {
  Setup: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Analysis: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  RAG: 'text-primary bg-primary/10 border-primary/20',
  AI: 'text-accent bg-accent/10 border-accent/20',
}

export function Commands() {
  return (
    <section className="py-24" id="commands">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            CLI Reference
          </p>
          <h2 className="text-4xl font-bold text-white md:text-5xl">Supported commands</h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/8 bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  Command
                </th>
                <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted sm:table-cell">
                  Phase
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {commands.map((c, i) => (
                <tr
                  key={c.cmd}
                  className={`border-b border-white/4 transition-colors hover:bg-white/2 ${i === commands.length - 1 ? 'border-none' : ''}`}
                >
                  <td className="px-6 py-4">
                    <code className="rounded-md bg-black/40 px-2 py-1 text-xs font-mono text-primary">
                      {c.cmd}
                    </code>
                  </td>
                  <td className="hidden px-6 py-4 sm:table-cell">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${phaseColor[c.phase]}`}
                    >
                      {c.phase}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">{c.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
