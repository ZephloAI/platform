"use client";

import { motion } from "framer-motion";
import { ease } from "@/lib/motion";

const testimonials = [
  {
    quote: "Our activation rate jumped from 23% to 68% in the first month. Users actually complete onboarding now.",
    name: "Sarah Chen",
    role: "Head of Product",
    company: "Series B SaaS",
  },
  {
    quote: "We cut onboarding support tickets by 60%. The ROI was obvious within the first week.",
    name: "Marcus Rivera",
    role: "VP of Customer Success",
    company: "Enterprise Platform",
  },
  {
    quote: "Deployed in 3 days. No backend changes. No OAuth flows to build. It just worked with our existing product.",
    name: "Ava Okonkwo",
    role: "Engineering Lead",
    company: "Developer Tools",
  },
];

export default function OnboardingSocialProof() {
  return (
    <section className="relative py-24 sm:py-40 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: ease.out }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">Trusted by Forward-Thinking Teams</span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: ease.out }}
              className="group rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-8 flex flex-col gap-6 transition-all duration-500 hover:border-[var(--accent)]/10 hover:bg-[var(--card-hover)]"
            >
              <div className="text-3xl leading-none gradient-text font-serif">&ldquo;</div>
              <p className="text-base leading-relaxed text-[var(--foreground)] opacity-90 -mt-2 flex-1">{t.quote}</p>
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-[var(--subtle-white-04)]">
                <div className="h-10 w-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[11px] font-medium text-[var(--accent)] select-none shrink-0">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{t.name}</p>
                  <p className="text-[12px] text-[var(--muted)]">{t.role} &middot; {t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
