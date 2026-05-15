const features = [
  {
    icon: '🔍',
    title: 'RAG powered',
    body: 'Qdrant vector database + OpenAI embeddings for context-aware retrieval across your entire codebase.',
  },
  {
    icon: '🧩',
    title: 'Deep COBOL parser',
    body: 'Parses DATA DIVISION variables — field names, PIC types, COMP-3 usage, WORKING-STORAGE and LINKAGE sections. Not just text search.',
  },
  {
    icon: '⚡',
    title: 'CLI first',
    body: 'No browser, no account, no setup friction. Point at any folder and run — no path argument required.',
  },
  {
    icon: '🤖',
    title: 'Multi-agent orchestrator',
    body: 'One command (`analyze`) coordinates scan → dependency analysis → AI explanation → full Markdown report automatically.',
  },
  {
    icon: '📊',
    title: 'Modernization plans',
    body: 'Generate structured migration specs targeting TypeScript, Java, Python or Go from existing programs.',
  },
  {
    icon: '📝',
    title: 'Markdown docs',
    body: 'Auto-generate technical documentation in Markdown with diagrams, summaries and business rules.',
  },
]

export function Features() {
  return (
    <section className="py-24" id="features">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Everything you need to understand legacy systems
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/6 bg-card p-7 transition-all hover:border-primary/20 hover:glow-primary"
            >
              <div className="mb-4 text-3xl">{f.icon}</div>
              <h3 className="mb-2 text-base font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
