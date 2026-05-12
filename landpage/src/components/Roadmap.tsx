const items = [
  { label: 'VS Code extension', status: 'planned' },
  { label: 'Web dashboard', status: 'planned' },
  { label: 'Multiple vector databases (Pinecone, Weaviate)', status: 'planned' },
  { label: 'Improved COBOL parser (full ANS-85 coverage)', status: 'planned' },
  { label: 'Impact analysis reports', status: 'planned' },
  { label: 'GitHub integration & PR reviews', status: 'planned' },
  { label: 'Local LLM support (Ollama)', status: 'planned' },
  { label: 'NestJS API platform + streaming', status: 'planned' },
  { label: 'Multi-tenant enterprise runtime', status: 'planned' },
  { label: 'MCP server for Claude Desktop', status: 'planned' },
]

const done = [
  'CLI scaffold with Commander.js',
  'COBOL AST parser (pure, no I/O)',
  'RAG engine with Qdrant',
  'ask, scan, flow, embed commands',
  'Docker Compose local infra',
]

export function Roadmap() {
  return (
    <section className="py-24" id="roadmap">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Roadmap
          </p>
          <h2 className="text-4xl font-bold text-white md:text-5xl">What's coming next</h2>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Done
            </h3>
            <ul className="space-y-3">
              {done.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="mt-0.5 flex-shrink-0 text-accent">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-muted" />
              Planned
            </h3>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.label} className="flex items-start gap-3 text-sm text-muted">
                  <span className="mt-0.5 flex-shrink-0 text-primary/50">◦</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
