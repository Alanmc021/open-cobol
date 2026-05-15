const lines = [
  { type: 'prompt', text: 'opencobol analyze' },
  { type: 'blank', text: '' },
  { type: 'label', text: '  ⠿  Scanning COBOL files…' },
  { type: 'label', text: '  ⠿  Analyzing dependencies…' },
  { type: 'label', text: '  ⠿  Explaining programs with AI…' },
  { type: 'label', text: '  ⠿  Assembling report…' },
  { type: 'blank', text: '' },
  { type: 'success', text: '  ✔ Analysis complete' },
  { type: 'blank', text: '' },
  { type: 'heading', text: '# OpenCobol Analysis Report' },
  { type: 'blank', text: '' },
  { type: 'context', text: '## Summary' },
  { type: 'body', text: '| Programs | 3 |  | Copybooks | 4 |  | Total lines | 1,240 |' },
  { type: 'blank', text: '' },
  { type: 'context', text: '## Call Dependencies' },
  { type: 'body', text: '· DBACCESS  ← called by: PAYROLL.cbl, CUSTOMER.cbl, INVENTORY.cbl' },
  { type: 'body', text: '· TAX-SERVICE  ← called by: PAYROLL.cbl' },
  { type: 'blank', text: '' },
  { type: 'context', text: '## Program Explanations' },
  { type: 'body', text: '### PAYROLL.cbl  —  Processes gross pay, tax deductions and net salary.' },
  { type: 'body', text: '### CUSTOMER.cbl  —  Manages accounts, balance reconciliation and status.' },
  { type: 'blank', text: '' },
  { type: 'footer', text: '  Report saved to opencobol-report.md · 3 programs · 4.2s' },
]

export function TerminalDemo() {
  return (
    <section className="py-24" id="demo">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Live demo
          </p>
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            See it in action
          </h2>
          <p className="mt-4 text-muted">
            One command orchestrates the full pipeline — scan, dependencies, AI explanations and a complete Markdown report.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/8 bg-card shadow-2xl glow-primary">
          <div className="flex items-center justify-between border-b border-white/5 bg-black/40 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>
            <span className="text-xs text-muted font-mono">opencobol — analyze</span>
            <div className="w-16" />
          </div>

          <div className="overflow-x-auto p-6 font-mono text-sm scrollbar-none">
            {lines.map((line, i) => {
              if (line.type === 'blank') return <div key={i} className="h-3" />
              if (line.type === 'prompt') {
                return (
                  <div key={i} className="flex gap-2">
                    <span className="select-none text-accent">$</span>
                    <span className="text-white">{line.text}</span>
                  </div>
                )
              }
              if (line.type === 'label') {
                return (
                  <p key={i} className="text-primary text-xs">
                    {line.text}
                  </p>
                )
              }
              if (line.type === 'success') {
                return (
                  <p key={i} className="text-green-400 text-sm font-semibold">
                    {line.text}
                  </p>
                )
              }
              if (line.type === 'context') {
                return (
                  <p key={i} className="text-xs text-muted italic">
                    {line.text}
                  </p>
                )
              }
              if (line.type === 'heading') {
                return (
                  <p key={i} className="font-semibold text-accent">
                    {line.text}
                  </p>
                )
              }
              if (line.type === 'body') {
                return (
                  <p key={i} className="text-gray-300 text-sm leading-relaxed pl-2">
                    {line.text}
                  </p>
                )
              }
              if (line.type === 'footer') {
                return (
                  <div key={i} className="mt-2 border-t border-white/5 pt-3 text-xs text-muted">
                    {line.text}
                  </div>
                )
              }
              return null
            })}
            <div className="mt-4 flex gap-1">
              <span className="text-accent select-none">$</span>
              <span className="ml-1 inline-block h-4 w-2 animate-blink bg-primary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
