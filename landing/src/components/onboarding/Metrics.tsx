"use client";

import { motion } from "framer-motion";

const metrics = [
  { value: "85%", label: "Reduction in time-to-value", detail: "Hours of setup become a 2-minute conversation" },
  { value: "3x", label: "Higher activation rates", detail: "Users complete onboarding in their first session" },
  { value: "60%", label: "Fewer support tickets", detail: "Setup questions answered before they\u2019re asked" },
  { value: "Days", label: "To deploy, not months", detail: "No backend integration or API work needed" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

export default function OnboardingMetrics() {
  return (
    <section className="relative py-24 sm:py-40 px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px]" style={{ background: "radial-gradient(ellipse at center, rgba(18,117,202,0.06) 0%, rgba(96,165,250,0.03) 40%, transparent 70%)" }} />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="text-center mb-20"
        >
          <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">The Impact</span>
          <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
            Get users to value,<br />
            <span className="gradient-text">not the docs page.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="group rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-7 text-center transition-all duration-500 hover:border-[var(--accent)]/15 hover:bg-[var(--card-hover)]"
            >
              <p className="text-4xl sm:text-5xl font-bold gradient-text tracking-tight leading-none mb-3">{metric.value}</p>
              <p className="text-sm font-semibold text-[var(--foreground)] mb-2">{metric.label}</p>
              <p className="text-[12px] leading-relaxed text-[var(--muted)]">{metric.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
