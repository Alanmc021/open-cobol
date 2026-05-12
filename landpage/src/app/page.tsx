import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { Problem } from '@/components/Problem'
import { Solution } from '@/components/Solution'
import { HowItWorks } from '@/components/HowItWorks'
import { TerminalDemo } from '@/components/TerminalDemo'
import { Features } from '@/components/Features'
import { Commands } from '@/components/Commands'
import { Architecture } from '@/components/Architecture'
import { Audience } from '@/components/Audience'
import { Install } from '@/components/Install'
import { Roadmap } from '@/components/Roadmap'
import { CTA } from '@/components/CTA'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <TerminalDemo />
        <Features />
        <Commands />
        <Architecture />
        <Audience />
        <Install />
        <Roadmap />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
