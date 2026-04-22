"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState, useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Point us at your URL",
    description:
      "Paste in your site. Our crawler discovers every page, chunks it, and embeds it into a per-Agent vector index. Re-crawl on a schedule or on-demand.",
  },
  {
    number: "02",
    title: "Drop in the widget",
    description:
      "One script tag and your Agent appears as a chat experience. Use the inline <zephlo-chat> element for embedded surfaces — works in any framework.",
  },
  {
    number: "03",
    title: "Extend with custom tools",
    description:
      "Optional: register browser-side tools with the Zephlo SDK. The Agent can fill forms, navigate, and take action — all in your visitor's session.",
  },
];

const codeSnippet = `<script src="https://cdn.zephlo.ai/widget.js" data-agent-id="YOUR_AGENT_UUID"></script>`;

function CodeBlock() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-5 rounded-xl border border-[var(--subtle-white-06)] bg-[var(--code-bg)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--subtle-white-04)]">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]/60" />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] rounded"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" style={{ color: "var(--emerald)" }} />
              <span style={{ color: "var(--emerald)" }}>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="px-4 py-3.5 overflow-x-auto">
        <pre className="text-[12px] sm:text-[13px] font-[family-name:var(--font-geist-mono)] text-[var(--foreground)] opacity-80 whitespace-pre-wrap break-all sm:whitespace-nowrap sm:break-normal">
          <code>{codeSnippet}</code>
        </pre>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.7], ["0%", "100%"]);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative py-24 sm:py-32 px-6">
      <div className="absolute inset-0 grid-pattern opacity-30" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="text-center mb-20"
        >
          <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">
            How it works
          </span>
          <h2 className="font-serif text-4xl font-semibold tracking-tight leading-[1.08] sm:text-5xl lg:text-[3.5rem]">
            Live in minutes,
            <br />
            <span className="italic text-[var(--accent)]">not months.</span>
          </h2>
        </motion.div>

        <div className="relative">
          <div
            className="absolute left-[27px] top-4 bottom-4 w-px bg-[var(--subtle-white-04)] hidden sm:block"
            aria-hidden="true"
          >
            <motion.div
              style={{ height: lineHeight }}
              className="w-full bg-gradient-to-b from-[var(--accent)] to-[var(--accent-light)] rounded-full"
            />
          </div>

          <ol className="flex flex-col gap-16">
            {steps.map((step, i) => (
              <motion.li
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" as const }}
                className="relative flex gap-6 sm:gap-12"
              >
                <div className="flex-shrink-0 relative z-10">
                  <span className="text-3xl sm:text-5xl font-bold gradient-text font-[family-name:var(--font-geist-mono)]">
                    {step.number}
                  </span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg sm:text-2xl font-semibold text-[var(--foreground)] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed text-[var(--muted)] max-w-lg">
                    {step.description}
                  </p>
                  {step.number === "02" && <CodeBlock />}
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
