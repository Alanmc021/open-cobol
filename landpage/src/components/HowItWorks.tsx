const steps = [
  {
    n: '01',
    title: 'Install the CLI',
    body: 'One command to install globally from npm.',
    cmd: 'npm install -g opencobol',
  },
  {
    n: '02',
    title: 'Run setup wizard',
    body: 'Configure your OpenAI API key and Qdrant endpoint.',
    cmd: 'opencobol init',
  },
  {
    n: '03',
    title: 'Index your codebase',
    body: 'Point at your COBOL folder — or just run from inside it. Parses every program, copybook and DATA DIVISION variable.',
    cmd: 'opencobol embed',
  },
  {
    n: '04',
    title: 'Get a full report',
    body: 'One command runs the full orchestrated pipeline: scan, dependencies, AI explanations and a Markdown report.',
    cmd: 'opencobol analyze',
  },
]

export function HowItWorks() {
  return (
    <section className="py-24" id="how-it-works">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="text-4xl font-bold text-white md:text-5xl">Up and running in 4 steps</h2>
        </div>

        <div className="relative grid gap-8 md:grid-cols-4">
          <div className="absolute top-8 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent md:block" />

          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 text-xl font-bold text-primary">
                {step.n}
              </div>
              <div>
                <h3 className="mb-1.5 text-base font-semibold text-white">{step.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted">{step.body}</p>
                <div className="overflow-hidden rounded-lg border border-white/6 bg-card px-3 py-2 font-mono text-xs text-primary">
                  <span className="text-muted select-none">$ </span>
                  {step.cmd}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
