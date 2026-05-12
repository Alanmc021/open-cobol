import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OpenCobol AI — Chat with your COBOL codebase',
  description:
    'OpenCobol AI indexes legacy COBOL systems with Qdrant and OpenAI so teams can ask questions, trace dependencies, generate docs and plan modernization.',
  openGraph: {
    title: 'OpenCobol AI — Chat with your COBOL codebase',
    description:
      'Semantic search, dependency analysis and AI-powered documentation for legacy COBOL systems.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-background text-gray-200 antialiased">{children}</body>
    </html>
  )
}
