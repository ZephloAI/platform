"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion, LayoutGroup } from "framer-motion";
import { ease, duration } from "@/lib/motion";
import {
  Globe,
  Workflow,
  Code2,
  Sparkles,
  ArrowRight,
  Link2,
  Database,
  Bot,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
  id: string;
  icon: LucideIcon;
  title: string;
  badge?: string;
  summary: string;
  description: string;
};

const features: Feature[] = [
  {
    id: "grounded",
    icon: Globe,
    title: "Grounded in your content",
    summary: "Crawl, chunk, embed.",
    description:
      "Point us at a URL. Zephlo crawls every page, chunks it, and embeds it into a vector store — so the Agent answers from your actual site, cites its source, and never hallucinates a page that isn’t there.",
  },
  {
    id: "agentic",
    icon: Workflow,
    title: "Agentic by default",
    badge: "Tools",
    summary: "It doesn’t just answer — it acts.",
    description:
      "Every Agent can navigate visitors to the right page out of the box. Register custom tools to fill forms, toggle settings, or trigger workflows — all executed client-side in the visitor’s own browser session.",
  },
  {
    id: "embed",
    icon: Code2,
    title: "Embed in one line",
    summary: "One script tag. Any framework.",
    description:
      "Drop the script tag, or use the <zephlo-chat> element inline. Works in Next.js, Remix, Astro, Rails, WordPress, plain HTML — anywhere you can paste a tag. Zero backend integration.",
  },
  {
    id: "webmcp",
    icon: Sparkles,
    title: "WebMCP ready",
    badge: "Standards",
    summary: "Ready for the model-aware web.",
    description:
      "Tools you register show up automatically on the emerging navigator.modelContext API. The same Agent you ship today works with model-aware browsers tomorrow — no rewrite.",
  },
];

type PipelineNode = {
  id: string;
  icon: LucideIcon;
  label: string;
  sub: string;
};

const pipeline: PipelineNode[] = [
  { id: "url", icon: Link2, label: "Your URL", sub: "acme.com" },
  { id: "crawl", icon: Globe, label: "Crawler", sub: "412 pages indexed" },
  { id: "embed", icon: Database, label: "Vector store", sub: "grounded context" },
  { id: "agent", icon: Bot, label: "Zephlo Agent", sub: "reasoning + tools" },
  { id: "user", icon: MessageSquare, label: "Your visitor", sub: "in the browser" },
];

function PipelineVisual({ activeIndex }: { activeIndex: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[48px] bg-[var(--accent)]/[0.08] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="relative overflow-hidden rounded-2xl border border-[var(--subtle-white-06)] bg-[var(--card)]/80 p-8 backdrop-blur-2xl"
        style={{ boxShadow: "0 40px 80px -24px var(--shadow-color)" }}
      >
        <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden="true" />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Agent pipeline
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]"
                aria-hidden="true"
              />
              live
            </span>
          </div>

          <ol className="flex flex-col gap-3 pt-2">
            {pipeline.map(({ id, icon: Icon, label, sub }, i) => {
              const isActive = i <= activeIndex;
              return (
                <li key={id} className="relative flex items-center gap-4">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1 : 0.95,
                      opacity: isActive ? 1 : 0.55,
                    }}
                    transition={reduce ? { duration: 0 } : { duration: 0.35 }}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300 ${
                      isActive
                        ? "border-[var(--accent)]/40 bg-[var(--accent)]/[0.08] text-[var(--accent)]"
                        : "border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] text-[var(--muted)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </motion.div>
                  <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] font-semibold text-[var(--foreground)]">
                      {label}
                    </span>
                    <span className="truncate font-mono text-[10px] text-[var(--muted)]">
                      {sub}
                    </span>
                  </div>
                  {i < pipeline.length - 1 && (
                    <span
                      className="absolute left-[22px] top-[44px] h-3 w-px bg-gradient-to-b from-[var(--accent)]/30 to-transparent"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-4 flex items-center gap-2 border-t border-[var(--subtle-white-06)] pt-4 text-[11px] text-[var(--muted)]">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--emerald)]" />
            Answers cite sources · tools run client-side
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  const [activeId, setActiveId] = useState<string>(features[0].id);
  const activeIndex = Math.max(
    0,
    features.findIndex((f) => f.id === activeId),
  );
  // Map feature index to pipeline highlight: grounded→embed(2), agentic→agent(3),
  // embed→user(4), webmcp→user(4).
  const pipelineHighlight =
    activeIndex === 0 ? 2 : activeIndex === 1 ? 3 : 4;

  return (
    <section id="features" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: ease.out }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-5 inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            What you get
          </span>
          <h2 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Everything you need to ship a{" "}
            <span className="gradient-text italic">production-grade</span> Agent.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">
            Crawler, vector store, retrieval, model orchestration, and an embeddable
            widget — wired together so you can focus on your product.
          </p>
        </motion.div>

        <div className="mt-20 grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <LayoutGroup id="features">
          <ul className="flex flex-col gap-3">
            {features.map(({ id, icon: Icon, title, badge, summary, description }) => {
              const isActive = id === activeId;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(id)}
                    aria-expanded={isActive}
                    className="group relative block w-full rounded-2xl border border-[var(--subtle-white-06)] bg-[var(--card)] p-6 text-left transition-colors duration-300 hover:border-[var(--accent)]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="feature-active-bg"
                        aria-hidden="true"
                        transition={{ duration: duration.state, ease: ease.out }}
                        className="pointer-events-none absolute inset-0 rounded-2xl border border-[var(--accent)]/30 bg-[var(--card-hover)]"
                        style={{ boxShadow: "0 20px 40px -28px var(--shadow-color)" }}
                      />
                    )}
                    <div className="relative flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-[var(--accent)]/[0.12] text-[var(--accent)]"
                            : "bg-[var(--icon-bg)] text-[var(--accent)] group-hover:bg-[var(--icon-bg-hover)]"
                        }`}
                        aria-hidden="true"
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">
                            {title}
                          </h3>
                          {badge && (
                            <span className="inline-flex items-center rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--accent)]">
                              {badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[13px] text-[var(--muted)]">
                          {summary}
                        </p>
                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.p
                              key="desc"
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.3, ease: ease.out }}
                              className="overflow-hidden text-[14px] leading-relaxed text-[var(--foreground)]/80"
                            >
                              {description}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                      <ArrowRight
                        className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-300 ${
                          isActive ? "rotate-90 text-[var(--accent)]" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          </LayoutGroup>

          <div className="lg:sticky lg:top-24">
            <PipelineVisual activeIndex={pipelineHighlight} />
          </div>
        </div>
      </div>
    </section>
  );
}
