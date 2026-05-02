"use client";

import { motion } from "framer-motion";
import { ease } from "@/lib/motion";
import { ArrowRight, Zap, ShieldCheck, MessageCircle, Sparkles, Eye, Headphones, Check } from "lucide-react";
import { links } from "@/lib/links";

const stats = [
  { value: "47%", label: "lift in first-session activation" },
  { value: "2 min", label: "from sign-up to first value" },
  { value: "Days", label: "to deploy — not months" },
];

const capabilities = [
  {
    icon: Zap,
    title: "Zero integration overhead",
    description: "Define tools, not API connections. No OAuth flows, no credential management, no months of engineering. Most teams ship onboarding in under a week.",
  },
  {
    icon: ShieldCheck,
    title: "Nothing leaves the browser",
    description: "Tools run in the user's own session with their existing permissions. Zephlo never sees passwords, tokens, or session cookies — your security review gets a lot shorter.",
  },
  {
    icon: MessageCircle,
    title: "Chat from anywhere",
    description: "Web widget, WhatsApp, Telegram, mobile SDK. Users can start onboarding on their phone and finish it on their laptop without losing context.",
  },
  {
    icon: Sparkles,
    title: "Personalized to each user",
    description: "The Agent adapts to what each user is actually trying to do — not a generic tour. A solo founder gets a different setup than a 50-person sales team, automatically.",
  },
  {
    icon: Eye,
    title: "Watch it happen, live",
    description: "Users see their workspace configure itself in real time as they chat. No black-box automation — every action is visible, narrated, and can be paused.",
  },
  {
    icon: Headphones,
    title: "Clean human escalation",
    description: "When intent is complex or trust matters, the Agent hands off to your team with full context — what they tried, where they got stuck, what's next.",
  },
];

const flow = [
  {
    step: "01",
    title: "User signs up",
    description: "They land on your post-signup screen. The Zephlo widget greets them by name and asks what they're hoping to accomplish.",
  },
  {
    step: "02",
    title: "Agent listens for intent",
    description: "Plain-language conversation. The Agent learns the user's goal — their team size, their integrations, their first job-to-be-done — and picks the right setup path.",
  },
  {
    step: "03",
    title: "Tools execute in-browser",
    description: "Workspace creation, teammate invites, integration toggles, default preferences — all performed client-side using the user's own session. They watch it happen.",
  },
  {
    step: "04",
    title: "User hits activation",
    description: "By the end of the conversation, they've done the thing they signed up to do. No tutorial backlog, no support ticket, no second-day return needed.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: ease.out },
  }),
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, delay: i * 0.08, ease: ease.out },
  }),
};

export default function OnboardingContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-36 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 aurora opacity-50" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div
          className="pointer-events-none absolute -top-[150px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px]"
          style={{
            background:
              "radial-gradient(ellipse at center, var(--page-accent-glow) 0%, var(--page-accent-soft) 40%, transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] px-4 py-1.5 text-[12px] text-[var(--page-accent)] backdrop-blur-sm mb-6">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: "var(--page-accent)" }}
                aria-hidden="true"
              />
              Onboarding
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight leading-[1.1] mb-6">
              Users describe goals.<br />
              <span className="gradient-text">Zephlo does the rest.</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              Conversational onboarding that configures your product directly
              in the user&apos;s browser. No API integrations. No credential
              storage. No 12-step setup wizard. Activation happens in the first
              session, not the third.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={links.signUp}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
              >
                Start free
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--subtle-white-06)] px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-all duration-300 hover:bg-[var(--subtle-white-03)] hover:border-[var(--subtle-white-hover)]"
              >
                See how it works
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-8 text-center"
              >
                <p className="text-4xl sm:text-5xl font-bold gradient-text mb-2">{stat.value}</p>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="relative py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: ease.out }}
            className="text-center mb-20"
          >
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">What it does</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
              The browser is<br />
              <span className="gradient-text">the integration layer.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <motion.div
                  key={cap.title}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-60px" }}
                  className="group rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-7 flex flex-col gap-4 transition-all duration-500 hover:border-[var(--page-accent-border)] hover:bg-[var(--card-hover)]"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--page-accent)]"
                    style={{ background: "var(--page-accent-soft)" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">{cap.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted)]">{cap.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works / Flow */}
      <section id="how-it-works" className="relative py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">How it works</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
              From sign-up to activation<br />
              <span className="gradient-text">in one conversation.</span>
            </h2>
          </motion.div>

          <div className="flex flex-col gap-5">
            {flow.map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="group rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-7 sm:p-8 flex gap-6 sm:gap-8 transition-all duration-500 hover:border-[var(--page-accent-border)] hover:bg-[var(--card-hover)]"
              >
                <div className="shrink-0">
                  <div className="h-12 w-12 rounded-xl border border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] flex items-center justify-center text-[var(--page-accent)] font-mono text-sm font-semibold">
                    {item.step}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted)] max-w-2xl">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcome panel */}
      <section className="relative py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="rounded-3xl gradient-border bg-[var(--card)] p-10 sm:p-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
          >
            <div className="flex flex-col gap-5">
              <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--page-accent)]">The outcome</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15]">
                Activated users.<br />
                <span className="gradient-text">No hand-holding.</span>
              </h2>
              <p className="text-base text-[var(--muted)] leading-relaxed">
                Zephlo turns your setup wizard into a 2-minute conversation.
                Users describe their goal, watch their account configure
                itself, and start using your product before they&apos;ve
                finished their coffee.
              </p>
            </div>

            <ul className="flex flex-col gap-3.5">
              {[
                "Higher activation in the first session, every session",
                "Onboarding-related support tickets cut dramatically",
                "Personalized to each user's goal — no generic walkthrough",
                "Works across web, mobile, and messaging channels",
                "Live in days, not months — no backend changes required",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--foreground)]">
                  <div className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--page-accent-soft)" }}>
                    <Check className="h-3 w-3 text-[var(--page-accent)]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center gap-6"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              End the setup wizard.
            </h2>
            <p className="text-base text-[var(--muted)] max-w-md">
              Drop in the widget. Define your tools. Watch users hit activation
              in their first session.
            </p>
            <a
              href={links.signUp}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
            >
              Start free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}
