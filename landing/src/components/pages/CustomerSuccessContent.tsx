"use client";

import { motion } from "framer-motion";
import { ease } from "@/lib/motion";
import { ArrowRight, Compass, Wrench, Sparkles, ShieldOff, BookOpen, Headphones, Check } from "lucide-react";
import { links } from "@/lib/links";

const tools = [
  {
    icon: Compass,
    title: "“Where is X?” — answered by doing",
    description: "Instead of pointing at a menu, the Agent navigates the user there. It clicks the tab, opens the panel, scrolls to the setting. The user sees how it's done while it's done.",
  },
  {
    icon: Wrench,
    title: "“How do I do Y?” — done in the chat",
    description: "Tools run client-side using the user's own session. Update billing, add a teammate, change a preference, run a report — the Agent performs the action with the user's permission.",
  },
  {
    icon: Sparkles,
    title: "Discovers features users would never find",
    description: "When a user describes a goal, the Agent suggests the right feature — even ones buried three menus deep. Power features stop being hidden.",
  },
  {
    icon: BookOpen,
    title: "Reads your docs, then acts on them",
    description: "Your help center grounds every answer. But unlike a doc bot, the Agent doesn't just quote the article — it executes the steps inside the user's product.",
  },
  {
    icon: ShieldOff,
    title: "No credentials, no scraping",
    description: "Tools run inside the user's own browser tab. Zephlo never sees passwords, never proxies sessions, never reads the screen. You define exactly what the Agent can touch.",
  },
  {
    icon: Headphones,
    title: "Escalation when it matters",
    description: "For the questions only a human should answer, the Agent hands off cleanly — with the full context, what was tried, and what the user is still stuck on.",
  },
];

const beforeAfter = [
  {
    before: "Hire a CS team that grows linearly with the customer base",
    after: "Deploy one Agent that handles thousands of users in parallel",
  },
  {
    before: "“Have you tried clearing your cache?” for the hundredth time",
    after: "Repetitive how-to questions resolved in seconds, in-product",
  },
  {
    before: "Users churn because they can't figure out the killer feature",
    after: "Users discover and adopt features mid-conversation",
  },
  {
    before: "Onboarding emails nobody opens",
    after: "Personalized, on-demand help triggered by the user's own goals",
  },
  {
    before: "Tickets piled up overnight, picked up groggily at 9am",
    after: "Most questions resolved before a CSM ever sees them",
  },
];

const setupSteps = [
  {
    step: "01",
    title: "Define the tools",
    description: "List the actions your Agent can take on a user's behalf — update profile, run a report, invite a teammate. Each tool is a small client-side function that talks to your existing UI. No backend changes.",
  },
  {
    step: "02",
    title: "Drop in the widget",
    description: "One script tag. The Agent appears wherever your users already are — logged-in dashboard, mobile app, or marketing site. Live in under a day.",
  },
  {
    step: "03",
    title: "Watch adoption climb",
    description: "Every conversation is captured with intent, outcome, and the tool path taken. Your CS team sees exactly where users get stuck — and how the Agent unblocks them.",
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

export default function CustomerSuccessContent() {
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
              Customer Success
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight leading-[1.1] mb-6">
              Stop answering<br />
              <span className="gradient-text">&ldquo;how do I do X?&rdquo;</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              Your customers don&apos;t want a knowledge base. They want the thing
              done. Zephlo Agents use client-side tools to actually take the action
              for them &mdash; right inside your product, with no setup beyond a script tag.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={links.signUp}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
              >
                Deploy the Agent
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
              <a
                href="#tools"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--subtle-white-06)] px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-all duration-300 hover:bg-[var(--subtle-white-03)] hover:border-[var(--subtle-white-hover)]"
              >
                See what it can do
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="relative py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: ease.out }}
            className="text-center mb-20"
          >
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">Client-side tools</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
              Doesn&apos;t explain.<br />
              <span className="gradient-text">Just does it.</span>
            </h2>
            <p className="mt-6 text-base text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              Every tool runs in the user&apos;s own browser session. No screen scraping,
              no credential storage, no backend integration. You define what&apos;s
              possible &mdash; the Agent does the rest.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.title}
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
                  <h3 className="text-base font-semibold text-[var(--foreground)]">{tool.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted)]">{tool.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="relative py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: ease.out }}
            className="text-center mb-16"
          >
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">The shift</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
              From a queue of tickets<br />
              <span className="gradient-text">to a queue of done.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-8 sm:p-10"
            >
              <span className="inline-block text-[11px] font-medium uppercase tracking-wider text-[var(--muted)] mb-5">Before</span>
              <ul className="flex flex-col gap-4">
                {beforeAfter.map((row) => (
                  <li key={row.before} className="text-sm leading-relaxed text-[var(--muted)]">
                    {row.before}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              custom={0.12}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="rounded-2xl border border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] p-8 sm:p-10"
            >
              <span className="inline-block text-[11px] font-medium uppercase tracking-wider text-[var(--page-accent)] mb-5">After Zephlo</span>
              <ul className="flex flex-col gap-4">
                {beforeAfter.map((row) => (
                  <li key={row.after} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--foreground)]">
                    <div className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--page-accent-soft)" }}>
                      <Check className="h-3 w-3 text-[var(--page-accent)]" />
                    </div>
                    {row.after}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Setup */}
      <section className="relative py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">Setup</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
              Easy enough that<br />
              <span className="gradient-text">CS doesn&apos;t need engineering.</span>
            </h2>
          </motion.div>

          <div className="flex flex-col gap-5">
            {setupSteps.map((item, i) => (
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

      {/* Bottom CTA */}
      <section className="relative py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl gradient-border bg-[var(--card)] p-10 sm:p-16 flex flex-col items-center gap-6"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Customer success, on autopilot.
            </h2>
            <p className="text-base text-[var(--muted)] max-w-md">
              Free your CS team from repetitive how-to&apos;s. Let the Agent handle
              the doing &mdash; humans handle the thinking.
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
