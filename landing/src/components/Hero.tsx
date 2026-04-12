"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles, MoreHorizontal, Mic, Paperclip, Play, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay, ease: "easeOut" as const },
  }),
};

function ChatWidgetMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.4, ease: "easeOut" as const }}
      className="relative group w-full max-w-[540px] lg:ml-auto"
    >
      <div className="absolute -inset-8 -z-10 rounded-[48px] bg-[var(--accent)]/[0.10] blur-3xl scale-75 group-hover:scale-100 transition-transform duration-700" />

      <div
        className="relative overflow-hidden rounded-2xl border border-[var(--subtle-white-06)] bg-[var(--card)]/80 backdrop-blur-2xl"
        style={{ boxShadow: "0 40px 80px -24px var(--shadow-color)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-t border-[var(--subtle-white-06)] bg-[var(--card)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--icon-bg)]">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[var(--foreground)]">Zephlo Agent</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                Optimizing workflow
              </div>
            </div>
          </div>
          <MoreHorizontal className="h-5 w-5 text-[var(--muted)]" />
        </div>

        {/* Messages */}
        <div className="space-y-5 px-6 py-6 h-[420px] overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="flex gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)]">
              <Bot className="h-3.5 w-3.5 text-[var(--muted)]" />
            </div>
            <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-3 text-[13px] leading-relaxed text-[var(--foreground)]">
              I see you&apos;re looking to update your policy. I&apos;ve retrieved your current
              coverage for{" "}
              <span className="font-semibold text-[var(--accent)]">Vehicle ID: AX-492</span>.
              Would you like to add a second driver or adjust the deductible?
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="flex justify-end"
          >
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#1275CA] px-4 py-3 text-[13px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(18,117,202,0.6)]">
              Let&apos;s adjust the deductible to $500.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.1, duration: 0.5 }}
            className="flex gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)]">
              <Bot className="h-3.5 w-3.5 text-[var(--muted)]" />
            </div>
            <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-3 text-[13px] leading-relaxed text-[var(--foreground)]">
              Done. This will reduce your monthly premium by{" "}
              <span className="font-semibold text-[var(--accent)]">$14.20</span>. Shall I finalize
              this change for you?
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.6, duration: 0.4 }}
            className="flex flex-wrap gap-2 pl-11 pt-1"
          >
            <QuickReply label="Yes, finalize now" />
            <QuickReply label="See full breakdown" />
          </motion.div>
        </div>

        {/* Input */}
        <div className="border-t border-[var(--subtle-white-06)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between rounded-lg border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-3">
            <span className="text-[13px] text-[var(--muted)]">Type your response…</span>
            <div className="flex items-center gap-3">
              <Mic className="h-4 w-4 text-[var(--muted)]" />
              <Paperclip className="h-4 w-4 text-[var(--muted)]" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickReply({ label }: { label: string }) {
  return (
    <button className="rounded-full border border-[var(--subtle-white-06)] bg-[var(--card)] px-4 py-1.5 text-[11px] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--accent)]/50 hover:text-[var(--accent)]">
      {label}
    </button>
  );
}

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-40 pb-24 sm:pb-32">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-10%] top-[-20%] h-[60%] w-[55%] rounded-full bg-[var(--accent)]/[0.10] blur-[160px]" />
        <div className="absolute right-[-10%] top-[30%] h-[50%] w-[45%] rounded-full bg-[#60A5FA]/[0.06] blur-[160px]" />
      </div>
      <div className="absolute inset-0 grid-pattern opacity-50" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2 xl:gap-24">
        <div className="flex flex-col gap-10">
          <motion.div custom={0.1} variants={fadeUp} initial="hidden" animate="show">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-1.5 text-[12px] text-[var(--muted)] backdrop-blur-sm">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: "var(--emerald)" }}
              />
              Conversational AI infrastructure
            </span>
          </motion.div>

          <motion.h1
            custom={0.2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-[5.25rem]"
          >
            Turn Complex{" "}
            <br className="hidden sm:block" />
            <span className="italic text-[var(--accent)]">Workflows</span> Into Simple
            Conversations
          </motion.h1>

          <motion.p
            custom={0.5}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="max-w-lg text-lg leading-relaxed text-[var(--muted)] sm:text-xl"
          >
            Your users don&apos;t want to click through forms. Let them just say what they need
            with an Agent platform built for real business workflows.
          </motion.p>

          <motion.div
            custom={0.7}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex flex-wrap gap-3 pt-2"
          >
            <a
              href="#get-started"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#1275CA] px-7 py-4 text-[15px] font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_40px_-6px_rgba(18,117,202,0.55)]"
            >
              Start Conversing
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
            <a
              href="#video"
              className="group inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-7 py-4 text-[15px] font-semibold text-[var(--foreground)] transition-all duration-300 hover:bg-[var(--subtle-white-06)]"
            >
              <Play className="h-3.5 w-3.5" />
              Watch the Video
            </a>
          </motion.div>
        </div>

        <div className="lg:justify-self-end">
          <ChatWidgetMockup />
        </div>
      </div>
    </section>
  );
}
