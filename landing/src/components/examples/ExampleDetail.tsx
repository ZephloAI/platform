"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Code2, Sparkles } from "lucide-react";
import type { Example } from "./examplesData";
import { examples, templateUrl } from "./examplesData";
import { iconMap } from "./iconMap";
import ExampleChat from "./ExampleChat";

export default function ExampleDetail({ example }: { example: Example }) {
  const Icon = iconMap[example.icon];
  const others = examples.filter((e) => e.slug !== example.slug).slice(0, 3);

  return (
    <>
      {/* Hero + Demo */}
      <section className="relative overflow-hidden px-6 pt-32 pb-16">
        <div className="absolute inset-0 aurora opacity-40" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.a
            href="/examples"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All examples
          </motion.a>

          <div className="mt-8 grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            {/* Left: copy */}
            <div className="flex flex-col gap-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--icon-bg)] text-[var(--accent)]">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <span className="inline-flex items-center rounded-full border border-[var(--subtle-white-06)] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
                  {example.accentLabel}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05 }}
                className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]"
              >
                {example.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-lg font-medium text-[var(--accent)]"
              >
                {example.tagline}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="max-w-xl text-[15px] leading-relaxed text-[var(--muted)]"
              >
                {example.description}
              </motion.p>

              <motion.ul
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="flex flex-col gap-3 pt-2"
              >
                {example.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-3 text-[14px] text-[var(--foreground)]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--icon-bg)]">
                      <Check className="h-3 w-3 text-[var(--accent)]" />
                    </span>
                    {h}
                  </li>
                ))}
              </motion.ul>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="flex flex-wrap gap-3 pt-3"
              >
                <a
                  href={templateUrl(example.templateSlug)}
                  className="group inline-flex items-center gap-2 rounded-full bg-[#1275CA] px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
                >
                  Use this template
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/#contact"
                  className="inline-flex items-center rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-7 py-3.5 text-[14px] font-semibold text-[var(--foreground)] transition-all duration-300 hover:bg-[var(--subtle-white-06)]"
                >
                  Talk to us first
                </a>
              </motion.div>
            </div>

            {/* Right: live demo */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:sticky lg:top-28"
            >
              <div className="absolute -inset-8 -z-10 rounded-[48px] bg-[var(--accent)]/[0.10] blur-3xl" />
              <ExampleChat example={example} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Embed snippet */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-3 py-1 text-[11px] text-[var(--muted)]">
                <Code2 className="h-3 w-3 text-[var(--accent)]" />
                Embed in one line
              </div>
              <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Drop the Agent into your site.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--muted)]">
                Use the <code className="text-[var(--accent)]">{"<zephlo-chat>"}</code>{" "}
                inline element for a full-page chat surface, or add the script
                tag for a floating widget.
              </p>
            </div>

            <div className="space-y-4">
              <CodeBlock
                label="Inline element"
                code={`<script src="https://app.zephlo.ai/widget/zephlo.js"></script>
<script>
  Zephlo.initialize({
    key: "flk_live_xxx",
    chatbotId: "${example.embed.agentId}"
  });
</script>
<zephlo-chat width="420" height="560"></zephlo-chat>`}
              />
              <CodeBlock
                label="Floating widget"
                code={`<script
  src="https://app.zephlo.ai/widget/zephlo.js"
  data-chatbot-id="${example.embed.agentId}"
></script>`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Other examples */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              More Agents to try
            </h2>
            <a
              href="/examples"
              className="hidden items-center gap-1.5 text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--foreground)] sm:inline-flex"
            >
              See all
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {others.map((o) => {
              const OtherIcon = iconMap[o.icon];
              return (
                <a
                  key={o.slug}
                  href={`/examples/${o.slug}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-[var(--subtle-white-06)] bg-[var(--card)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--icon-bg)] text-[var(--accent)]">
                    <OtherIcon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                      {o.title}
                    </h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">
                      {o.tagline}
                    </p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--accent)]">
                    View example
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative px-6 pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl border border-[var(--subtle-white-06)] bg-[var(--card)] p-10 sm:p-14">
            <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--icon-bg)]">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to try {example.title.toLowerCase()}?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[var(--muted)]">
              Spin up your copy of this template and point it at your content.
              You&apos;ll be live in minutes.
            </p>
            <a
              href={templateUrl(example.templateSlug)}
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-[#1275CA] px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
            >
              Use this template
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--subtle-white-06)] bg-[var(--code-bg)]">
      <div className="flex items-center justify-between border-b border-[var(--subtle-white-06)] px-4 py-2.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
          {label}
        </span>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--subtle-white-06)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--subtle-white-06)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--subtle-white-06)]" />
        </div>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed text-[var(--foreground)]">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
