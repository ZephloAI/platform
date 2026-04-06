"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Zap, ShieldCheck, RefreshCw, ArrowRight } from "lucide-react";
import { useRef } from "react";

const pillars = [
  {
    icon: Zap,
    title: "Zero integration overhead",
    description: "Define tools, not API connections. No backend auth setup needed.",
    metric: "5 min",
    metricLabel: "average setup",
  },
  {
    icon: ShieldCheck,
    title: "No credentials stored",
    description: "Tools run in the user\u2019s session. Nothing leaves the browser.",
    metric: "Zero",
    metricLabel: "data exposure",
  },
  {
    icon: RefreshCw,
    title: "Chat from anywhere",
    description: "Mobile, WhatsApp, Telegram, web \u2014 tools execute in the connected browser.",
    metric: "4+",
    metricLabel: "channels",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

function TraditionalFlow() {
  const steps = ["User Request", "Your Backend", "OAuth / API Keys", "Third-party API", "Response", "Your Frontend"];
  return (
    <div className="flex flex-col items-center gap-1.5">
      {steps.map((step, i) => (
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="rounded-lg border border-[var(--subtle-white)] bg-[var(--card)] px-4 py-2 text-[12px] font-medium text-[var(--muted)]">
            {step}
          </div>
          {i < steps.length - 1 && (
            <div className="flex flex-col items-center my-0.5">
              <div className="h-2.5 w-px bg-[var(--subtle-white-06)]" />
              <ArrowRight className="h-2.5 w-2.5 rotate-90 text-[var(--muted)] opacity-30" />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function ZephloFlow() {
  const steps = ["User chats", "AI decides tool", "Tool runs in browser"];
  return (
    <div className="flex flex-col items-center gap-1.5">
      {steps.map((step, i) => (
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12, duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <div
            className={`rounded-lg px-4 py-2 text-[12px] font-medium ${
              step === "AI decides tool"
                ? "border border-[var(--accent)]/25 bg-[var(--accent)]/[0.06] text-[var(--accent)]"
                : "border border-[var(--subtle-white)] bg-[var(--card)] text-[var(--foreground)]"
            }`}
          >
            {step}
          </div>
          {i < steps.length - 1 && (
            <div className="flex flex-col items-center my-0.5">
              <div className="h-2.5 w-px bg-[var(--accent)] opacity-20" />
              <ArrowRight className="h-2.5 w-2.5 rotate-90 text-[var(--accent)] opacity-40" />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default function Solution() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const bgOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden py-24 sm:py-40">
      <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0 aurora pointer-events-none" />
      <div className="absolute inset-0 dot-pattern opacity-40" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="text-center"
        >
          <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-5">
            The Zephlo Approach
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
            The browser is
            <br />
            <span className="gradient-text">the integration layer.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--muted)]">
            Businesses define tools that run client-side in the user&apos;s browser.
            When the AI decides a tool is needed, it executes right there &mdash;
            using the user&apos;s existing session, permissions, and context.
          </p>
        </motion.div>

        <div className="mt-20 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {pillars.map(({ icon: Icon, title, description, metric, metricLabel }, i) => (
            <motion.div
              key={title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="group rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] backdrop-blur-sm p-7 text-center transition-all duration-500 hover:border-[var(--accent)]/15 hover:bg-[var(--card-hover)]"
            >
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--icon-bg)" }}>
                <Icon className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div className="mb-3">
                <span className="text-2xl font-bold gradient-text">{metric}</span>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">{metricLabel}</p>
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="mt-24"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] opacity-60 p-6 sm:p-10">
              <div className="mb-6 text-center">
                <span className="inline-block rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-3.5 py-1 text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
                  Traditional
                </span>
              </div>
              <TraditionalFlow />
              <p className="mt-6 text-center text-[12px] text-[var(--muted)] opacity-50">
                Months of integration work
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--accent)]/15 bg-[var(--accent)]/[0.02] p-6 sm:p-10">
              <div className="mb-6 text-center">
                <span className="inline-block rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/[0.06] px-3.5 py-1 text-[11px] font-medium uppercase tracking-wider text-[var(--accent)]">
                  Zephlo
                </span>
              </div>
              <ZephloFlow />
              <p className="mt-6 text-center text-[12px] text-[var(--accent)] opacity-60">
                Works in minutes
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
