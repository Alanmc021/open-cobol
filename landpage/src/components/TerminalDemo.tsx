const lines = [
  { type: 'prompt', text: 'opencobol ask "Como funciona o sistema?"' },
  { type: 'blank', text: '' },
  { type: 'label', text: '⚡ Searching 847 chunks across 3 programs...' },
  { type: 'blank', text: '' },
  {
    type: 'context',
    text: 'Context retrieved from: PAYROLL.cbl · CUSTOMER.cbl · INVENTORY.cbl',
  },
  { type: 'blank', text: '' },
  { type: 'heading', text: 'PAYROLL.cbl' },
  {
    type: 'body',
    text: 'Processes employee payroll by calculating gross pay, deductions, taxes and net salary. Outputs payslips and updates EMPDATA table.',
  },
  { type: 'blank', text: '' },
  { type: 'heading', text: 'CUSTOMER.cbl' },
  {
    type: 'body',
    text: 'Manages customer accounts: creation, updates, balance reconciliation and statement generation via CUSTFILE.',
  },
  { type: 'blank', text: '' },
  { type: 'heading', text: 'INVENTORY.cbl' },
  {
    type: 'body',
    text: 'Monitors stock levels, handles reorder triggers and writes alerts to the INVLOG file when thresholds are crossed.',
  },
  { type: 'blank', text: '' },
  { type: 'footer', text: '847 tokens · 3 sources · 1.4s' },
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
            Ask any question about your COBOL codebase and get a grounded, source-cited answer.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/8 bg-card shadow-2xl glow-primary">
          <div className="flex items-center justify-between border-b border-white/5 bg-black/40 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>
            <span className="text-xs text-muted font-mono">opencobol — ask</span>
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
