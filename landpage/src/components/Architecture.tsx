const layers = [
  {
    label: 'Input',
    items: ['COBOL files', 'Copybooks', 'JCL / Job control'],
    color: 'border-muted/30 bg-muted/5 text-muted',
    dot: 'bg-muted',
  },
  {
    label: 'CLI',
    items: ['opencobol CLI', 'Commander.js', 'Chalk + Ora'],
    color: 'border-yellow-400/30 bg-yellow-400/5 text-yellow-300',
    dot: 'bg-yellow-400',
  },
  {
    label: 'Parser',
    items: ['parser-core (pure AST)', 'COBOL grammar', 'Dependency graph'],
    color: 'border-blue-400/30 bg-blue-400/5 text-blue-300',
    dot: 'bg-blue-400',
  },
  {
    label: 'RAG Engine',
    items: ['Chunker', 'OpenAI Embeddings', 'Qdrant Vector DB'],
    color: 'border-primary/30 bg-primary/5 text-primary',
    dot: 'bg-primary',
  },
  {
    label: 'AI Runtime',
    items: ['LangGraph agents', 'LangChain', 'OpenAI / local LLM'],
    color: 'border-purple-400/30 bg-purple-400/5 text-purple-300',
    dot: 'bg-purple-400',
  },
  {
    label: 'Output',
    items: ['Natural language answers', 'Markdown docs', 'Migration plans'],
    color: 'border-accent/30 bg-accent/5 text-accent',
    dot: 'bg-accent',
  },
]

export function Architecture() {
  return (
    <section className="py-24" id="architecture">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Architecture
          </p>
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            How the pieces fit together
          </h2>
        </div>

        <div className="flex flex-col items-center gap-3 md:flex-row md:items-stretch md:justify-center">
          {layers.map((layer, i) => (
            <div key={layer.label} className="flex items-center gap-3 md:flex-col md:items-center">
              <div
                className={`w-full rounded-xl border p-5 text-center md:w-36 ${layer.color}`}
              >
                <div className={`mx-auto mb-2 h-2 w-2 rounded-full ${layer.dot}`} />
                <p className="mb-3 text-xs font-bold uppercase tracking-wider">{layer.label}</p>
                <ul className="space-y-1">
                  {layer.items.map((item) => (
                    <li key={item} className="text-xs text-gray-400">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {i < layers.length - 1 && (
                <div className="flex-shrink-0 text-muted md:rotate-90">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
