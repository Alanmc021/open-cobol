import { CodeBlock } from './CodeBlock'

const quickStart = `# 1. Install
npm install -g opencobol

# 2. Configure
opencobol init

# 3. Start Qdrant (Docker required)
docker run -p 6333:6333 qdrant/qdrant

# 4. Index your codebase
opencobol embed ./legacy

# 5. Ask questions
opencobol ask "What does this system do?"`

export function Install() {
  return (
    <section className="py-24" id="install">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Installation
          </p>
          <h2 className="text-4xl font-bold text-white md:text-5xl">Get started in minutes</h2>
          <p className="mt-4 text-muted">Requires Node.js 18+ and Docker for Qdrant.</p>
        </div>

        <CodeBlock code={quickStart} language="bash" />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Node.js', req: '≥ 18', note: 'runtime' },
            { label: 'Docker', req: 'any version', note: 'for Qdrant' },
            { label: 'OpenAI key', req: 'for AI features', note: 'scan/flow work offline' },
          ].map((r) => (
            <div key={r.label} className="rounded-xl border border-white/6 bg-card p-4 text-center">
              <p className="text-sm font-semibold text-white">{r.label}</p>
              <p className="mt-1 text-xs text-primary">{r.req}</p>
              <p className="mt-0.5 text-xs text-muted">{r.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
