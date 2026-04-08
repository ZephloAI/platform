"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const caseStudies = [
  {
    company: "Meridian SaaS",
    stat: "88%",
    statLabel: "Onboarding completion rate",
    quote: "Zephlo turned our 12-step setup wizard into a 2-minute conversation. Users actually finish onboarding now.",
    person: "Sarah Chen",
    role: "Head of Product",
    featured: true,
  },
  {
    company: "NovaTech",
    stat: "$420K",
    statLabel: "Annual support savings",
    quote: "We eliminated 60% of setup-related support tickets in the first month. The ROI was immediate.",
    person: "Marcus Rivera",
    role: "VP Customer Success",
    featured: false,
  },
  {
    company: "Skyline Analytics",
    stat: "3x",
    statLabel: "Faster time-to-value",
    quote: "Users hit their aha moment in under 5 minutes. Before Zephlo, it took days.",
    person: "Ava Okonkwo",
    role: "Engineering Lead",
    featured: false,
  },
  {
    company: "Quantum CRM",
    stat: "90%",
    statLabel: "Agent involvement rate",
    quote: "The AI handles everything from workspace setup to CRM configuration. Our support team focuses on real issues now.",
    person: "David Park",
    role: "CTO",
    featured: false,
  },
  {
    company: "Horizon Fintech",
    stat: "4 days",
    statLabel: "From zero to deployed",
    quote: "No backend changes needed. We defined our tools, dropped in the widget, and it just worked.",
    person: "Priya Sharma",
    role: "Product Manager",
    featured: false,
  },
  {
    company: "Atlas Commerce",
    stat: "72%",
    statLabel: "Deflection rate",
    quote: "Zephlo handles the repetitive setup questions automatically. Complex queries still go to humans, but there are far fewer now.",
    person: "Tom Richardson",
    role: "Support Director",
    featured: false,
  },
];

const logos = [
  "Meridian", "NovaTech", "Skyline", "Quantum", "Horizon",
  "Atlas", "Vertex", "Caliber", "Nexus", "Orbit",
  "Pinnacle", "Prism", "Beacon", "Vantage", "Acme",
];

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  show: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.7, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

export default function CustomersContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-36 pb-20 px-6">
        <div className="absolute inset-0 aurora opacity-50" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-5">Customer Stories</span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight leading-[1.1] mb-6">
              Teams shipping better<br />
              <span className="gradient-text">with Zephlo.</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              See how innovative companies use Zephlo to turn complex workflows into simple conversations —
              and the results they&apos;re getting.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="relative py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {caseStudies.map((study, i) => (
              <motion.div
                key={study.company}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className={`group rounded-2xl border p-7 flex flex-col gap-5 transition-all duration-500 ${
                  study.featured
                    ? "border-[var(--accent)]/15 bg-[var(--accent)]/[0.02] hover:border-[var(--accent)]/25 md:col-span-2 lg:col-span-1 lg:row-span-1"
                    : "border-[var(--subtle-white)] bg-[var(--card)] hover:border-[var(--accent)]/10 hover:bg-[var(--card-hover)]"
                }`}
              >
                <div>
                  <p className="text-4xl font-bold gradient-text tracking-tight leading-none">{study.stat}</p>
                  <p className="text-[12px] text-[var(--muted)] mt-1">{study.statLabel}</p>
                </div>
                <p className="text-sm leading-relaxed text-[var(--foreground)] opacity-85 flex-1">&ldquo;{study.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[var(--subtle-white-04)]">
                  <div className="h-9 w-9 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[10px] font-medium text-[var(--accent)] select-none shrink-0">
                    {study.person.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--foreground)]">{study.person}</p>
                    <p className="text-[11px] text-[var(--muted)]">{study.role} &middot; {study.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Logo Grid */}
      <section className="relative py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-14"
          >
            <p className="text-[12px] font-medium text-[var(--muted)] uppercase tracking-[0.2em]">
              Trusted by hundreds of teams worldwide
            </p>
          </motion.div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {logos.map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.4 }}
                className="flex items-center justify-center h-14 rounded-xl border border-[var(--subtle-white)] bg-[var(--card)] transition-all duration-300 hover:border-[var(--accent)]/10"
              >
                <span className="text-[13px] font-semibold text-[var(--muted)] opacity-50">{name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
              Ready to join them?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="/#get-started" className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]">
                Start Free Trial <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href="/#contact" className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--subtle-white-06)] px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-all duration-300 hover:bg-[var(--subtle-white-03)]">
                Contact Sales
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
