const solutions = [
  {
    tag: 'ask',
    title: 'Ask questions in natural language',
    body: 'Query your entire COBOL codebase as if talking to a senior developer who knows every line.',
    example: 'opencobol ask "Which programs calculate payroll?"',
    color: 'border-primary/30 bg-primary/5',
    labelColor: 'text-primary',
  },
  {
    tag: 'embed',
    title: 'Semantic search with Qdrant',
    body: 'Index programs and copybooks as vector embeddings for fast, context-aware retrieval.',
    example: 'opencobol embed ./legacy',
    color: 'border-accent/30 bg-accent/5',
    labelColor: 'text-accent',
  },
  {
    tag: 'scan + flow',
    title: 'Static dependency analysis',
    body: 'Map COPY statements, CALL targets and execution flow without running the code.',
    example: 'opencobol scan ./legacy && opencobol flow PAYROLL.cbl',
    color: 'border-purple-500/30 bg-purple-500/5',
    labelColor: 'text-purple-400',
  },
  {
    tag: 'modernize',
    title: 'Modernization planning',
    body: 'Generate structured migration plans to TypeScript, Java, Python or Go.',
    example: 'opencobol modernize PAYROLL.cbl --target typescript',
    color: 'border-orange-500/30 bg-orange-500/5',
    labelColor: 'text-orange-400',
  },
]

export function Solution() {
  return (
    <section className="py-24" id="solution">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            The solution
          </p>
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Turn COBOL code into{' '}
            <span className="gradient-text">AI-navigable context</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {solutions.map((s) => (
            <div
              key={s.tag}
              className={`rounded-2xl border p-7 transition-all hover:scale-[1.01] ${s.color}`}
            >
              <span
                className={`mb-4 inline-block rounded-md bg-black/30 px-2.5 py-1 font-mono text-xs font-semibold ${s.labelColor}`}
              >
                {s.tag}
              </span>
              <h3 className="mb-2 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mb-5 text-sm leading-relaxed text-muted">{s.body}</p>
              <div className="overflow-hidden rounded-lg bg-black/40 px-4 py-3 font-mono text-xs text-gray-400">
                <span className="text-muted">$ </span>
                {s.example}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
