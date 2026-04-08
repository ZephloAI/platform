"use client";

import { motion } from "framer-motion";
import { Building2, Users, Check } from "lucide-react";

const saasTeamBenefits = [
  "Define tools declaratively \u2014 no API plumbing",
  "Reduce onboarding drop-off from day one",
  "Cut repetitive support load dramatically",
  "Get users to activation faster than any tooltip tour",
  "Deploy alongside your product in days, not months",
  "Works with your existing product \u2014 no backend changes",
];

const endUserBenefits = [
  "Describe goals in plain language, skip the learning curve",
  "Watch your account configure itself while you chat",
  "Chat from any device \u2014 mobile, WhatsApp, web",
  "Personalized setup, not generic walkthroughs",
  "Get productive in your first session",
  "No tutorials to watch, no docs to read",
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: "easeOut" as const },
  }),
};

export default function OnboardingBenefits() {
  return (
    <section id="use-cases" className="relative overflow-hidden py-24 sm:py-40">
      <div className="pointer-events-none absolute right-0 top-1/4 w-[600px] h-[600px]" style={{ background: "radial-gradient(ellipse at center, rgba(18,117,202,0.04) 0%, rgba(96,165,250,0.02) 40%, transparent 70%)" }} />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="text-center"
        >
          <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">Benefits</span>
          <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
            Better for your team.<br />
            <span className="gradient-text">Better for your users.</span>
          </h2>
        </motion.div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="group rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-8 sm:p-10 transition-all duration-500 hover:border-[var(--accent)]/15 hover:bg-[var(--card-hover)]"
          >
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--icon-bg)" }}>
              <Building2 className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <span className="inline-block text-[11px] font-medium uppercase tracking-wider text-[var(--muted)] mb-4">For SaaS Teams</span>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-6">
              Ship onboarding that actually onboards.
            </h3>
            <ul className="flex flex-col gap-3.5">
              {saasTeamBenefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--muted)]">
                  <div className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--icon-bg)" }}>
                    <Check className="h-3 w-3 text-[var(--accent)]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            custom={0.12}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="group rounded-2xl border border-[var(--accent)]/15 bg-[var(--accent)]/[0.02] p-8 sm:p-10 transition-all duration-500 hover:border-[var(--accent)]/25"
          >
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--icon-bg)" }}>
              <Users className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <span className="inline-block text-[11px] font-medium uppercase tracking-wider text-[var(--accent)] mb-4">For End Users</span>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-6">
              Describe what you want. Watch it happen.
            </h3>
            <ul className="flex flex-col gap-3.5">
              {endUserBenefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--muted)]">
                  <div className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--icon-bg)" }}>
                    <Check className="h-3 w-3 text-[var(--accent)]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
