"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, Sparkles, MoreHorizontal, Mic, Paperclip, ArrowRight, Globe } from "lucide-react";
import { links } from "@/lib/links";

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, delay, ease: "easeOut" as const },
  }),
};

function ChatWidgetMockup() {
  const reduce = useReducedMotion();
  const enter = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: reduce ? 0 : delay, duration: 0.45 },
  });
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" as const }}
      className="relative group w-full max-w-[540px] lg:ml-auto"
      aria-label="Live preview of an embedded Zephlo Agent"
    >
      <div className="absolute -inset-8 -z-10 rounded-[48px] bg-[var(--accent)]/[0.10] blur-3xl scale-75 group-hover:scale-100 transition-transform duration-700" aria-hidden="true" />

      <div
        className="relative overflow-hidden rounded-2xl border border-[var(--subtle-white-06)] bg-[var(--card)]/80 backdrop-blur-2xl"
        style={{ boxShadow: "0 40px 80px -24px var(--shadow-color)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-t border-[var(--subtle-white-06)] bg-[var(--card)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--icon-bg)]" aria-hidden="true">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[var(--foreground)]">Acme Docs Agent</div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" aria-hidden="true" />
                Online · grounded in 412 pages
              </div>
            </div>
          </div>
          <MoreHorizontal className="h-5 w-5 text-[var(--muted)]" aria-hidden="true" />
        </div>

        {/* Messages */}
        <div className="space-y-5 px-6 py-6 h-[420px] overflow-hidden">
          <motion.div {...enter(0.9)} className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#1275CA] px-4 py-3 text-[13px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(18,117,202,0.6)]">
              How do I enable SSO on the Pro plan? Take me to the right page.
            </div>
          </motion.div>

          <motion.div {...enter(1.4)} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)]" aria-hidden="true">
              <Bot className="h-3.5 w-3.5 text-[var(--muted)]" />
            </div>
            <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-3 text-[13px] leading-relaxed text-[var(--foreground)]">
              SSO lives under <span className="font-semibold text-[var(--accent)]">Settings → Security</span>. Pro supports SAML, OIDC, and SCIM. Want me to open it for you?
            </div>
          </motion.div>

          <motion.div {...enter(1.9)} className="flex flex-wrap gap-2 pl-11 pt-1">
            <QuickReply label="Yes, take me there" highlighted />
            <QuickReply label="Show me a setup guide" />
          </motion.div>

          <motion.div {...enter(2.5)} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/[0.12]" aria-hidden="true">
              <Globe className="h-3.5 w-3.5 text-[var(--accent)]" />
            </div>
            <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-[var(--accent)]/25 bg-[var(--accent)]/[0.06] px-4 py-3 text-[12px] leading-relaxed text-[var(--foreground)]">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">tool · navigate</span>
              <div className="mt-1 text-[var(--muted)]">→ /settings/security/sso</div>
            </div>
          </motion.div>
        </div>

        {/* Input */}
        <div className="border-t border-[var(--subtle-white-06)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between rounded-lg border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-3">
            <span className="text-[13px] text-[var(--muted)]">Ask anything about Acme…</span>
            <div className="flex items-center gap-3" aria-hidden="true">
              <Mic className="h-4 w-4 text-[var(--muted)]" />
              <Paperclip className="h-4 w-4 text-[var(--muted)]" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickReply({ label, highlighted = false }: { label: string; highlighted?: boolean }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      className={`rounded-full border px-4 py-1.5 text-[11px] transition-colors duration-200 ${
        highlighted
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/[0.08] text-[var(--accent)]"
          : "border-[var(--subtle-white-06)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
      }`}
    >
      {label}
    </button>
  );
}

export default function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-72px)] items-center overflow-hidden px-6 pt-32 pb-24 sm:pt-40 sm:pb-32">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
        <div className="absolute left-[-10%] top-[-20%] h-[60%] w-[55%] rounded-full bg-[var(--accent)]/[0.10] blur-[160px]" />
        <div className="absolute right-[-10%] top-[30%] h-[50%] w-[45%] rounded-full bg-[#60A5FA]/[0.06] blur-[160px]" />
      </div>
      <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2 xl:gap-24">
        <div className="flex flex-col gap-9">
          <motion.div custom={0.05} variants={fadeUp} initial="hidden" animate="show">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-1.5 text-[12px] text-[var(--muted)] backdrop-blur-sm">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: "var(--emerald)" }}
                aria-hidden="true"
              />
              The Agent platform for any website
            </span>
          </motion.div>

          <motion.h1
            custom={0.15}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="font-serif text-[2.75rem] font-semibold leading-[1.04] tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-[5rem]"
          >
            Turn your website
            <br className="hidden sm:block" /> into an{" "}
            <span className="italic text-[var(--accent)]">Agent</span>.
          </motion.h1>

          <motion.p
            custom={0.35}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="max-w-xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl"
          >
            Point Zephlo at a URL. We crawl, embed, and ground a conversational Agent in
            your content — then drop it on your site with one script tag. It answers, it
            navigates, it takes action on your visitor&apos;s behalf.
          </motion.p>

          <motion.div
            custom={0.5}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            <a
              href={links.signUp}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#1275CA] px-7 py-4 text-[15px] font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_40px_-6px_rgba(18,117,202,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Start free
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
            <a
              href={links.sales}
              className="group inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-7 py-4 text-[15px] font-semibold text-[var(--foreground)] transition-all duration-300 hover:bg-[var(--subtle-white-06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Talk to sales
            </a>
          </motion.div>

          <motion.p
            custom={0.6}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-[12px] text-[var(--muted)]/80"
          >
            Free to start · No credit card · Live in under 5 minutes
          </motion.p>
        </div>

        <div className="lg:justify-self-end">
          <ChatWidgetMockup />
        </div>
      </div>
    </section>
  );
}
