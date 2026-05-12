'use client'

import { useState } from 'react'

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2">
          <span className="text-xl font-bold">
            <span className="gradient-text">OpenCobol</span>
            <span className="text-muted"> AI</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#solution" className="transition-colors hover:text-primary">
            Features
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-primary">
            How it works
          </a>
          <a href="#commands" className="transition-colors hover:text-primary">
            Commands
          </a>
          <a href="#roadmap" className="transition-colors hover:text-primary">
            Roadmap
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-muted transition-colors hover:border-primary/40 hover:text-primary"
          >
            GitHub
          </a>
          <a
            href="#install"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Get started
          </a>
        </div>

        <button
          className="text-muted md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-card px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4 text-sm text-muted">
            <a href="#solution" onClick={() => setOpen(false)} className="hover:text-primary">
              Features
            </a>
            <a href="#how-it-works" onClick={() => setOpen(false)} className="hover:text-primary">
              How it works
            </a>
            <a href="#commands" onClick={() => setOpen(false)} className="hover:text-primary">
              Commands
            </a>
            <a href="#roadmap" onClick={() => setOpen(false)} className="hover:text-primary">
              Roadmap
            </a>
            <a
              href="#install"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-primary px-4 py-2 text-center font-semibold text-background"
            >
              Get started
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
