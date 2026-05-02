"use client";

import { motion } from "framer-motion";
import { ease } from "@/lib/motion";
import { ArrowRight, Clock, Zap, MessageCircle, TrendingUp, Moon, Globe2, Check } from "lucide-react";
import { links } from "@/lib/links";

const stats = [
  { value: "78%", label: "of leads go cold within 5 minutes" },
  { value: "10x", label: "higher conversion when responses are instant" },
  { value: "24/7", label: "coverage with no extra headcount" },
];

const capabilities = [
  {
    icon: Clock,
    title: "Reply in seconds, not hours",
    description: "Visitors get answers the moment they land. No waiting on email, no losing them to a competitor while your team sleeps.",
  },
  {
    icon: Moon,
    title: "Always on, even at 3 AM",
    description: "Your Agent works through nights, weekends, and holidays. Every late-night visitor gets a real response — and a captured contact.",
  },
  {
    icon: MessageCircle,
    title: "Qualifies as it converses",
    description: "The Agent asks the right questions, scores intent, and routes hot leads to your team — cold ones nurture themselves.",
  },
  {
    icon: Zap,
    title: "Books meetings without you",
    description: "Tools run client-side to check calendars, schedule demos, and confirm bookings — all inside the chat.",
  },
  {
    icon: Globe2,
    title: "Speaks every visitor's language",
    description: "Greet leads in their native language automatically. No localization project, no translation bottleneck.",
  },
  {
    icon: TrendingUp,
    title: "Learns from every conversation",
    description: "Patterns surface in your dashboard — what visitors ask, where they drop off, what closes them. Your funnel gets sharper every week.",
  },
];

const flow = [
  {
    step: "01",
    title: "Visitor lands on your site",
    description: "A new prospect arrives — a paid ad click, an organic search, a referral. Your Agent greets them within a second.",
  },
  {
    step: "02",
    title: "Agent listens and qualifies",
    description: "Plain-language conversation. The Agent learns their goal, their company size, their timeline, and any objections.",
  },
  {
    step: "03",
    title: "Action happens in-browser",
    description: "Schedule a demo, fill the contact form, send a brochure, or hand off to live chat — all without the visitor leaving the page.",
  },
  {
    step: "04",
    title: "Lead lands in your CRM",
    description: "Captured with full conversation context, qualification signals, and next steps. Your sales team picks up where the Agent left off.",
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

export default function LeadGenerationContent() {
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
              "radial-gradient(ellipse at center, rgba(18,117,202,0.08) 0%, rgba(96,165,250,0.04) 40%, transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-1.5 text-[12px] text-[var(--muted)] backdrop-blur-sm mb-6">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: "var(--emerald)" }}
                aria-hidden="true"
              />
              Lead Generation
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight leading-[1.1] mb-6">
              Capture every lead.<br />
              <span className="gradient-text">Even the ones at midnight.</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              Most websites lose leads while their team is asleep, in meetings, or
              just slow to reply. Zephlo Agents respond in seconds, qualify with
              context, and book the meeting before the visitor moves on.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={links.signUp}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
              >
                Start capturing leads
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
              A revenue teammate<br />
              <span className="gradient-text">that never clocks out.</span>
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
                  className="group rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-7 flex flex-col gap-4 transition-all duration-500 hover:border-[var(--accent)]/15 hover:bg-[var(--card-hover)]"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--accent)]"
                    style={{ background: "var(--icon-bg)" }}
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
              From visitor to qualified lead<br />
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
                className="group rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-7 sm:p-8 flex gap-6 sm:gap-8 transition-all duration-500 hover:border-[var(--accent)]/15 hover:bg-[var(--card-hover)]"
              >
                <div className="shrink-0">
                  <div className="h-12 w-12 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.06] flex items-center justify-center text-[var(--accent)] font-mono text-sm font-semibold">
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
              <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">The outcome</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15]">
                More leads. Better leads.<br />
                <span className="gradient-text">Without more reps.</span>
              </h2>
              <p className="text-base text-[var(--muted)] leading-relaxed">
                Zephlo handles the first touch — instantly, in any timezone, in any
                language. Your team starts every day with a queue of warm,
                pre-qualified conversations instead of a graveyard of missed visitors.
              </p>
            </div>

            <ul className="flex flex-col gap-3.5">
              {[
                "Zero-second response time, around the clock",
                "Higher form completion — chat is easier than a wall of fields",
                "Cleaner CRM data with full conversation context",
                "Built-in escalation to live agents when intent is hot",
                "Deploy in under a day with one script tag",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--foreground)]">
                  <div className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--icon-bg)" }}>
                    <Check className="h-3 w-3 text-[var(--accent)]" />
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
              Stop losing leads after hours.
            </h2>
            <p className="text-base text-[var(--muted)] max-w-md">
              Drop in the widget. Connect your CRM. Watch every visitor turn into
              a captured, qualified conversation.
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
