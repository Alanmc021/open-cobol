export function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted sm:flex-row">
        <span>
          <span className="gradient-text font-semibold">OpenCobol AI</span> — MIT License
        </span>
        <div className="flex items-center gap-6">
          <a href="#" className="transition-colors hover:text-primary">
            Docs
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-primary"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-primary"
          >
            npm
          </a>
        </div>
      </div>
    </footer>
  )
}
