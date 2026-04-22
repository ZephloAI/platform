"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { examples, templateUrl } from "./examplesData";
import { iconMap } from "./iconMap";

export default function ExamplesIndex() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-36 pb-20">
        <div className="absolute inset-0 aurora opacity-60" />
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center gap-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-1.5 text-[12px] text-[var(--muted)] backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-[var(--accent)]" />
              Example Agents
            </span>
            <h1 className="font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-[4.5rem]">
              See what an{" "}
              <span className="italic text-[var(--accent)]">Agent</span> can do.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
              Every example below is a working Agent you can try right now.
              Click any template to deploy your own copy in under a minute.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="relative px-6 pb-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {examples.map((ex, i) => {
            const Icon = iconMap[ex.icon];
            return (
              <motion.a
                key={ex.slug}
                href={`/examples/${ex.slug}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                className="group relative flex flex-col gap-5 rounded-3xl border border-[var(--subtle-white-06)] bg-[var(--card)] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:bg-[var(--card-hover)]"
                style={{ boxShadow: "0 20px 40px -24px var(--shadow-color)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--icon-bg)] text-[var(--accent)] transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <span className="inline-flex items-center rounded-full border border-[var(--subtle-white-06)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                    {ex.accentLabel}
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
                    {ex.title}
                  </h2>
                  <p className="text-[13px] font-medium text-[var(--accent)]">{ex.tagline}</p>
                  <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                    {ex.description}
                  </p>
                </div>

                <ul className="flex flex-col gap-1.5 pt-1">
                  {ex.highlights.slice(0, 3).map((h) => (
                    <li
                      key={h}
                      className="flex items-start gap-2 text-[12px] text-[var(--muted)]"
                    >
                      <span
                        className="mt-1 block h-1 w-1 shrink-0 rounded-full"
                        style={{ background: "var(--accent)" }}
                      />
                      {h}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent)]">
                    Try the demo
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <a
                    href={templateUrl(ex.templateSlug)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-3 py-1.5 text-[11px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
                  >
                    Use template
                  </a>
                </div>
              </motion.a>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative px-6 pb-32">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl gradient-border bg-[var(--card)] p-10 sm:p-14"
          >
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Don&apos;t see your use case?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
              Agents work for almost any website workflow. Start from a blank
              template or bring your existing docs and tools — we&apos;ll help
              you shape it.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/agents/new"
                className="group inline-flex items-center gap-2 rounded-full bg-[#1275CA] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
              >
                Build your own Agent
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="/#contact"
                className="inline-flex items-center rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-all duration-300 hover:bg-[var(--subtle-white-06)]"
              >
                Talk to us
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
