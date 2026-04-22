"use client";

import { motion } from "framer-motion";
import { Globe, Sparkles, Code2, ShieldCheck, MessagesSquare, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: Globe,
    title: "Grounded in your content",
    description:
      "Point us at a URL. We crawl, chunk, and embed every page so the Agent answers from your actual site — not hallucinations.",
  },
  {
    icon: Workflow,
    title: "Agentic by default",
    description:
      "Every Agent can navigate visitors to the right page out of the box. Add custom tools to fill forms, update settings, or trigger workflows.",
  },
  {
    icon: Code2,
    title: "Embed in one line",
    description:
      "Drop the script tag, or use the <zephlo-chat> element inline. Works in any framework, on any page, on any plan.",
  },
  {
    icon: MessagesSquare,
    title: "Streaming, real-time chat",
    description:
      "WebSocket-backed conversations with token streaming and bidirectional tool calls. The Agent stays in sync with what is happening on the page.",
  },
  {
    icon: Sparkles,
    title: "WebMCP ready",
    description:
      "Tools you register show up automatically on the emerging navigator.modelContext API. The same Agent works with future model-aware browsers.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-tenant by design",
    description:
      "Per-organization isolation, role-based access, and granular usage limits. Built for teams that need to ship to production, not just a demo.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.07, ease: "easeOut" as const },
  }),
};

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">
            What you get
          </span>
          <h2 className="font-serif text-4xl font-semibold tracking-tight leading-[1.05] sm:text-5xl lg:text-[3.5rem]">
            Everything you need to ship a{" "}
            <span className="italic text-[var(--accent)]">production-grade</span> Agent.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">
            Zephlo is the full stack — crawler, vector store, retrieval, model orchestration,
            and an embeddable widget — wired together so you can focus on your product.
          </p>
        </motion.div>

        <div className="mt-20 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="group flex flex-col gap-5 rounded-2xl border border-[var(--subtle-white-06)] bg-[var(--card)] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/25 hover:bg-[var(--card-hover)]"
              style={{ boxShadow: "0 20px 40px -28px var(--shadow-color)" }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-[var(--accent)] transition-transform duration-300 group-hover:scale-110"
                style={{ background: "var(--icon-bg)" }}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                  {title}
                </h3>
                <p className="text-[14px] leading-relaxed text-[var(--muted)]">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
