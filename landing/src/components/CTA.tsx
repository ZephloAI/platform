"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, Copy, Check } from "lucide-react";
import { links } from "@/lib/links";
import { ease, duration } from "@/lib/motion";

const installSnippet =
  '<script src="https://unpkg.com/zephlo" data-key="your-key"></script>';

export default function CTA() {
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(installSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — fall through silently
    }
  };

  return (
    <section
      id="get-started"
      className="relative overflow-hidden border-t border-[var(--subtle-white-06)] px-6 py-32 sm:py-40"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <div
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(18,117,202,0.16) 0%, rgba(96,165,250,0.06) 40%, transparent 70%)",
          }}
          className="h-full w-full"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl space-y-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: ease.out }}
          className="space-y-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-1.5 text-[12px] text-[var(--muted)] backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
            Ready when you are
          </span>
          <h2 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[4rem]">
            Build your first Agent <span className="italic text-[var(--accent)]">today</span>.
          </h2>
          <p className="mx-auto max-w-xl text-lg text-[var(--muted)]">
            Sign up, point us at your URL, and watch a grounded, agentic chat experience
            come together in under five minutes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: ease.out }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <motion.a
            whileHover={reduce ? undefined : { y: -2 }}
            whileTap={reduce ? undefined : { y: 0, scale: 0.985 }}
            transition={{ duration: duration.feedback, ease: ease.out }}
            href={links.signUp}
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#1275CA] px-8 py-4 text-[15px] font-semibold text-white shadow-[0_12px_32px_-12px_rgba(18,117,202,0.6)] transition-shadow duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_22px_52px_-8px_rgba(18,117,202,0.75)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Start free
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </motion.a>
          <motion.a
            whileHover={reduce ? undefined : { y: -2 }}
            whileTap={reduce ? undefined : { y: 0, scale: 0.985 }}
            transition={{ duration: duration.feedback, ease: ease.out }}
            href={links.sales}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-8 py-4 text-[15px] font-semibold text-[var(--foreground)] transition-colors duration-300 hover:bg-[var(--subtle-white-06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Talk to sales
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.2, ease: ease.out }}
          className="mx-auto w-full max-w-xl"
        >
          <div className="flex items-center gap-3 rounded-xl border border-[var(--subtle-white-06)] bg-[var(--code-bg)] px-4 py-3 text-left font-mono text-[13px] text-[var(--foreground)]/90">
            <span className="shrink-0 text-[var(--accent)]">$</span>
            <code className="flex-1 overflow-x-auto whitespace-nowrap">
              {installSnippet}
            </code>
            <button
              type="button"
              onClick={onCopy}
              aria-label={copied ? "Copied" : "Copy install snippet"}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] text-[var(--muted)] transition-colors duration-200 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
          <p className="mt-3 text-center text-[12px] text-[var(--muted)]/80">
            Drop this into any page. Works with any framework.
          </p>
        </motion.div>

        <p className="text-[13px] text-[var(--muted)]/80">
          Already have an account?{" "}
          <a
            href={links.signIn}
            className="text-[var(--foreground)] underline decoration-[var(--subtle-white-06)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
          >
            Sign in
          </a>
        </p>
      </div>
    </section>
  );
}
