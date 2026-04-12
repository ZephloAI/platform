"use client";

import { motion } from "framer-motion";
import { UserCircle2, Zap } from "lucide-react";

export default function CTA() {
  return (
    <section
      id="get-started"
      className="relative overflow-hidden border-t border-[var(--subtle-white-06)] px-6 py-32 sm:py-40"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2">
        <div
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(18,117,202,0.12) 0%, rgba(96,165,250,0.05) 40%, transparent 70%)",
          }}
          className="h-full w-full"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl space-y-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="space-y-5"
        >
          <h2 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Ready to Build <span className="italic text-[var(--accent)]">Yours?</span>
          </h2>
          <p className="mx-auto max-w-xl text-xl text-[var(--muted)]">
            Tell us what you&apos;re working on. We&apos;ll show you how Zephlo fits.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: "easeOut" as const }}
          className="mx-auto max-w-md overflow-hidden rounded-2xl border border-[var(--subtle-white-06)] bg-[var(--card)]/80 text-left backdrop-blur-2xl"
          style={{ boxShadow: "0 40px 80px -24px var(--shadow-color)" }}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-[var(--subtle-white-06)] bg-[var(--card)] px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-500/40" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/40" />
            <div className="h-3 w-3 rounded-full bg-green-500/40" />
            <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
              Lead capturing…
            </span>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6 p-8"
          >
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1275CA] text-white">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-3 text-[13px] leading-relaxed text-[var(--foreground)]">
                Hi! I&apos;m Zephlo&apos;s lead architect. Describe the workflow you&apos;d
                like to automate and I&apos;ll generate a custom demo for you.
              </div>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="workflow"
                className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]"
              >
                Your Workflow Description
              </label>
              <textarea
                id="workflow"
                placeholder="e.g. A new patient intake form for a dental clinic…"
                className="min-h-[110px] w-full resize-none rounded-lg border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-3 text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40"
              />
            </div>

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#1275CA] py-4 text-[14px] font-semibold text-white shadow-[0_12px_32px_-12px_rgba(18,117,202,0.6)] transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_16px_40px_-10px_rgba(18,117,202,0.7)]"
            >
              Generate My Demo
              <Zap className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
