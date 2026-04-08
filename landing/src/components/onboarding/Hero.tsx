"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Clock, Sparkles, Globe } from "lucide-react";
import { useRef } from "react";

const wordReveal = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const wordItem = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: "easeOut" as const },
  }),
};

function OnboardingDemo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 1, ease: "easeOut" as const }}
      className="relative w-full max-w-md mx-auto lg:mx-0"
    >
      <div className="rounded-2xl border border-[var(--subtle-white-06)] bg-[var(--card)] overflow-hidden shadow-2xl" style={{ boxShadow: `0 25px 50px -12px var(--shadow-color)` }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--subtle-white-04)]">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--subtle-white-06)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--subtle-white-06)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--subtle-white-06)]" />
          </div>
          <div className="flex-1 mx-8">
            <div className="h-5 rounded-md bg-[var(--subtle-white-04)] flex items-center justify-center">
              <span className="text-[10px] text-[var(--muted)]">app.yourproduct.com/onboarding</span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className="flex justify-end"
          >
            <div className="rounded-2xl rounded-br-md bg-[var(--accent)]/15 border border-[var(--accent)]/20 px-4 py-2.5 max-w-[80%]">
              <p className="text-[13px] text-[var(--foreground)]">I want to set up my workspace with team notifications and invite my cofounder</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="flex justify-start"
          >
            <div className="rounded-2xl rounded-bl-md bg-[var(--subtle-white-03)] border border-[var(--subtle-white-06)] px-4 py-2.5 max-w-[80%]">
              <p className="text-[13px] text-[var(--foreground)] opacity-80">On it. Configuring your workspace now...</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.6, duration: 0.5 }}
            className="rounded-xl border border-[var(--accent)]/15 bg-[var(--accent)]/[0.04] p-3"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <div className="h-5 w-5 rounded-md bg-[var(--icon-bg)] flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-[var(--accent)]" />
              </div>
              <span className="text-[11px] font-medium text-[var(--accent)]">Configuring in browser</span>
            </div>
            <div className="space-y-1.5">
              <ToolStep delay={2.9} label="create_workspace" />
              <ToolStep delay={3.2} label="enable_notifications" />
              <ToolStep delay={3.5} label="send_invite" done />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 3.9, duration: 0.5 }}
            className="flex justify-start"
          >
            <div className="rounded-2xl rounded-bl-md bg-[var(--subtle-white-03)] border border-[var(--subtle-white-06)] px-4 py-2.5 max-w-[80%]">
              <p className="text-[13px] text-[var(--foreground)] opacity-80">All set! Your workspace is ready and the invite is sent.</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute -inset-8 -z-10 rounded-3xl bg-[var(--accent)]/[0.06] blur-3xl" />
    </motion.div>
  );
}

function ToolStep({ delay, label, done }: { delay: number; label: string; done?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-2"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.2 }}
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--emerald)" }}
      />
      <span className="text-[11px] font-mono text-[var(--muted)]">{label}</span>
      {done && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
          className="text-[10px]"
          style={{ color: "var(--emerald)", opacity: 0.7 }}
        >
          completed
        </motion.span>
      )}
    </motion.div>
  );
}

export default function OnboardingHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden">
      <motion.div style={{ y: bgY }} className="absolute inset-0 aurora" />
      <div className="absolute inset-0 grid-pattern" />

      <div
        className="pointer-events-none absolute -top-[200px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(18,117,202,0.08) 0%, rgba(96,165,250,0.04) 40%, transparent 70%)",
        }}
      />

      <motion.div style={{ opacity }} className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16 lg:gap-20">
          <div className="flex flex-col gap-7">
            <motion.div custom={0.1} variants={fadeUp} initial="hidden" animate="show">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-1.5 text-[12px] text-[var(--muted)] backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--emerald)" }} />
                AI onboarding that executes, not explains
              </span>
            </motion.div>

            <motion.h1
              variants={wordReveal}
              initial="hidden"
              animate="show"
              className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight leading-[1.1]"
            >
              <motion.span variants={wordItem} className="inline-block">Your&nbsp;</motion.span>
              <motion.span variants={wordItem} className="inline-block">users&nbsp;</motion.span>
              <motion.span variants={wordItem} className="inline-block">describe&nbsp;</motion.span>
              <motion.span variants={wordItem} className="inline-block">goals.</motion.span>
              <br />
              <motion.span variants={wordItem} className="inline-block gradient-text">Zephlo&nbsp;</motion.span>
              <motion.span variants={wordItem} className="inline-block gradient-text">does&nbsp;</motion.span>
              <motion.span variants={wordItem} className="inline-block gradient-text">the&nbsp;</motion.span>
              <motion.span variants={wordItem} className="inline-block gradient-text">rest.</motion.span>
            </motion.h1>

            <motion.p
              custom={0.8}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="max-w-lg text-base sm:text-lg leading-relaxed text-[var(--muted)]"
            >
              Conversational onboarding that configures your product directly in the browser.
              No API integrations. No credential storage. No user effort.
              The browser is the integration layer.
            </motion.p>

            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="flex flex-col sm:flex-row gap-3 mt-1">
              <a
                href="#contact"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
              >
                Request a demo
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--subtle-white-06)] px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-all duration-300 hover:bg-[var(--subtle-white-03)] hover:border-[var(--subtle-white-hover)]"
              >
                See how it works
              </a>
            </motion.div>

            <motion.div custom={1.2} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-6 mt-2">
              <TrustSignal icon={<Clock className="h-3.5 w-3.5" />} text="2-min onboarding" />
              <TrustSignal icon={<Sparkles className="h-3.5 w-3.5" />} text="No API setup" />
              <TrustSignal icon={<Globe className="h-3.5 w-3.5" />} text="Any web app" />
            </motion.div>
          </div>

          <div className="hidden lg:block">
            <OnboardingDemo />
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
    </section>
  );
}

function TrustSignal({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
      {icon}
      <span>{text}</span>
    </div>
  );
}
