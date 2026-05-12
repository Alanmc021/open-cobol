const installCommands = [
  { prompt: '$', cmd: 'npm install -g opencobol', color: 'text-primary' },
  { prompt: '$', cmd: 'opencobol init', color: 'text-primary' },
  { prompt: '$', cmd: 'opencobol embed ./legacy', color: 'text-primary' },
  { prompt: '$', cmd: 'opencobol ask "What does this system do?"', color: 'text-accent' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,212,255,0.12), transparent)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Open source · CLI-first · AI-powered
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
            Chat with your{' '}
            <span className="gradient-text">COBOL codebase</span>{' '}
            using AI
          </h1>

          <p className="mb-10 text-lg leading-relaxed text-muted md:text-xl">
            OpenCobol AI indexes legacy COBOL systems with Qdrant and OpenAI so teams can{' '}
            <span className="text-gray-300">ask questions</span>,{' '}
            <span className="text-gray-300">trace dependencies</span>,{' '}
            <span className="text-gray-300">generate docs</span> and{' '}
            <span className="text-gray-300">plan modernization</span>.
          </p>

          <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#install"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-background transition-opacity hover:opacity-90"
            >
              Get started
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-base font-semibold text-muted transition-colors hover:border-primary/30 hover:text-primary"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-card shadow-2xl glow-primary">
            <div className="flex items-center gap-2 border-b border-white/5 bg-black/30 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-muted">terminal</span>
            </div>
            <div className="p-6 font-mono text-sm">
              {installCommands.map((line, i) => (
                <div key={i} className="mb-2 flex gap-3">
                  <span className="select-none text-muted">{line.prompt}</span>
                  <span className={line.color}>{line.cmd}</span>
                </div>
              ))}
              <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4 text-xs leading-relaxed text-gray-300">
                <p className="mb-1 text-accent">✓ Indexed 3 programs · 847 chunks · 12ms</p>
                <p className="mt-3 font-semibold text-white">
                  {">"} This system manages payroll, customer accounts and inventory...
                </p>
                <p className="mt-1 text-muted">Context: PAYROLL.cbl, CUSTOMER.cbl, INVENTORY.cbl</p>
              </div>
              <div className="mt-3 flex gap-1">
                <span className="text-muted">$</span>
                <span className="animate-blink ml-1 inline-block h-4 w-2 bg-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
