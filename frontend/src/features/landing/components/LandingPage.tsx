import { AiPrescription } from "./ai-prescription"
import { Cta } from "./cta"
import { Faq } from "./faq"
import { Hero } from "./hero"
import { HowItWorks } from "./how-it-works"
import { Navbar } from "./navbar"
import { Pricing } from "./pricing"
import { Solutions } from "./solutions"
import { Testimonials } from "./testimonials"
import { WhyChoose } from "./why-choose"

/**
 * The public MediNex+ marketing landing page.
 * Assembled top-to-bottom, one section at a time (see incremental-section-build-workflow).
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Solutions />
        <AiPrescription />
        <WhyChoose />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <Faq />
        <Cta />
        {/* Following sections added after review. */}
      </main>
    </div>
  )
}
