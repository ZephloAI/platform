"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { links } from "@/lib/links";

export default function CTA() {
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
          transition={{ duration: 0.7, ease: "easeOut" as const }}
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
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" as const }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href={links.signUp}
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#1275CA] px-8 py-4 text-[15px] font-semibold text-white shadow-[0_12px_32px_-12px_rgba(18,117,202,0.6)] transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_16px_40px_-10px_rgba(18,117,202,0.7)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Start free
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
          <a
            href={links.sales}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-8 py-4 text-[15px] font-semibold text-[var(--foreground)] transition-all duration-300 hover:bg-[var(--subtle-white-06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Talk to sales
          </a>
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
