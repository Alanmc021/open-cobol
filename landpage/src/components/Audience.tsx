const audiences = [
  { icon: '🏦', title: 'Modernization teams', body: 'Plan and execute COBOL-to-cloud migrations with full codebase context.' },
  { icon: '🖥️', title: 'Mainframe engineers', body: 'Navigate systems you inherited without tribal knowledge.' },
  { icon: '🏢', title: 'Legacy consultants', body: 'Audit, document and quote modernization projects faster.' },
  { icon: '🏗️', title: 'Software architects', body: 'Map dependencies and design target state architectures.' },
  { icon: '👥', title: 'Teams that inherited COBOL', body: 'Onboard new developers onto systems with decades of history.' },
  { icon: '⚡', title: 'Enterprises migrating to cloud', body: 'De-risk critical business logic moves with AI-backed analysis.' },
]

export function Audience() {
  return (
    <section className="py-24" id="audience">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Who it's for
          </p>
          <h2 className="text-4xl font-bold text-white md:text-5xl">Built for legacy teams</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((a) => (
            <div
              key={a.title}
              className="flex items-start gap-4 rounded-2xl border border-white/6 bg-card p-6 transition-colors hover:border-primary/20"
            >
              <span className="mt-0.5 text-2xl flex-shrink-0">{a.icon}</span>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-white">{a.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{a.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
