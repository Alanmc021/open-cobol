const problems = [
  {
    icon: '📦',
    title: 'Code scattered across decades',
    body: 'Programs, copybooks and CALL chains spread across hundreds of files with no clear entry point.',
  },
  {
    icon: '🧠',
    title: 'Knowledge trapped in people',
    body: 'Business rules live in the heads of retiring specialists — not in the code or any documentation.',
  },
  {
    icon: '⚠️',
    title: 'Modernization is risky',
    body: "You can't safely change what you don't understand. Impact analysis takes weeks, not hours.",
  },
  {
    icon: '📄',
    title: 'Documentation does not exist',
    body: 'Technical specs are outdated, missing or never written. The code IS the documentation.',
  },
]

export function Problem() {
  return (
    <section className="py-24" id="problem">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            The problem
          </p>
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            COBOL systems are critical —{' '}
            <span className="text-muted">but hard to understand</span>
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-white/6 bg-card p-6 transition-colors hover:border-primary/20"
            >
              <div className="mb-4 text-3xl">{p.icon}</div>
              <h3 className="mb-2 text-base font-semibold text-white">{p.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
