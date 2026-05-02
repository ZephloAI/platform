"use client";

import { motion } from "framer-motion";
import { ease } from "@/lib/motion";
import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

const rows = [
  { feature: "User effort required", traditional: "High \u2014 clicks, reads, watches", traditionalGood: false, zephlo: "None \u2014 just describe the goal", zephloGood: true },
  { feature: "Time to first value", traditional: "Hours to days", traditionalGood: false, zephlo: "Minutes", zephloGood: true },
  { feature: "API / OAuth setup", traditional: "Months of engineering", traditionalGood: false, zephlo: "Not needed", zephloGood: true },
  { feature: "Credential storage", traditional: "Required for automation", traditionalGood: false, zephlo: "None \u2014 browser is the layer", zephloGood: true },
  { feature: "Personalization", traditional: "Generic walkthroughs", traditionalGood: false, zephlo: "Conversational, goal-based", zephloGood: true },
  { feature: "Cross-platform access", traditional: "In-app only", traditionalGood: false, zephlo: "Web, mobile, WhatsApp, Telegram", zephloGood: true },
  { feature: "Support ticket load", traditional: "High \u2014 same setup questions", traditionalGood: false, zephlo: "Dramatically reduced", zephloGood: true },
];

function StatusBadge({ good, children }: { good: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${good ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
      {good ? <Check className="h-4 w-4" style={{ color: "var(--check-color)" }} /> : <X className="h-4 w-4" style={{ color: "var(--x-color)" }} />}
      {children}
    </span>
  );
}

export default function OnboardingComparison() {
  return (
    <section className="relative py-24 sm:py-40 px-6">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: ease.out }}
          className="text-center mb-20"
        >
          <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">Comparison</span>
          <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
            Traditional vs. Zephlo.<br />
            <span className="gradient-text">The difference is clear.</span>
          </h2>
        </motion.div>

        <div className="space-y-0">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="hidden sm:grid grid-cols-[1.2fr_1.2fr_1.2fr] gap-4 px-5 py-4 mb-3"
          >
            <div />
            <p className="text-[12px] font-medium text-[var(--muted)] uppercase tracking-wider">Traditional Onboarding</p>
            <p className="text-[12px] font-semibold text-[var(--accent)] uppercase tracking-wider">With Zephlo</p>
          </motion.div>

          <div className="flex flex-col gap-2">
            {rows.map((row, i) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: ease.out }}
                className="group rounded-xl border border-[var(--subtle-white)] bg-[var(--card)] px-5 py-4 transition-all duration-300 hover:border-[var(--accent)]/10 hover:bg-[var(--card-hover)]"
              >
                <div className="hidden sm:grid grid-cols-[1.2fr_1.2fr_1.2fr] gap-4 items-center">
                  <p className="text-sm font-medium text-[var(--foreground)]">{row.feature}</p>
                  <StatusBadge good={row.traditionalGood}>{row.traditional}</StatusBadge>
                  <StatusBadge good={row.zephloGood}>{row.zephlo}</StatusBadge>
                </div>
                <div className="flex flex-col gap-2.5 sm:hidden">
                  <p className="text-sm font-medium text-[var(--foreground)]">{row.feature}</p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] opacity-50">Traditional</span>
                      <StatusBadge good={row.traditionalGood}>{row.traditional}</StatusBadge>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--accent)]">Zephlo</span>
                      <StatusBadge good={row.zephloGood}>{row.zephlo}</StatusBadge>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
