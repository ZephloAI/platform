"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Settings, Code, MessageCircle, Zap, Shield, BarChart3 } from "lucide-react";
import { useRef } from "react";
import { links } from "@/lib/links";

const flywheel = [
  { number: "01", title: "Define", subtitle: "Describe your tools", description: "Define the actions your agent can take \u2014 form fills, navigation, toggles, data entry. Each tool is a simple function that runs client-side. No SDK, no API plumbing.", icon: Settings, badge: null },
  { number: "02", title: "Deploy", subtitle: "One script tag", description: "Add the Zephlo widget to your site with a single line of code. Connect additional channels like WhatsApp, Telegram, or your mobile app in minutes.", icon: Code, badge: null },
  { number: "03", title: "Chat", subtitle: "Users describe intent", description: "Users say what they want in plain language. The AI understands intent, selects the right tools, and plans the execution \u2014 no menus, no tutorials, no clicks.", icon: MessageCircle, badge: null },
  { number: "04", title: "Execute", subtitle: "Browser does the work", description: "Tools run directly in the user\u2019s browser session using their existing permissions and context. Users watch their product configure itself in real time.", icon: Zap, badge: "Key differentiator" },
];

const techPipeline = [
  { title: "Intent Classification", description: "Understand what the user wants from natural language input. Route to the right tools or escalate to humans." },
  { title: "Tool Selection", description: "Match user intent against defined tools. Select the optimal execution path based on context and permissions." },
  { title: "Client-Side Execution", description: "Execute tools directly in the connected browser. No server roundtrips, no credential proxying, no API calls." },
  { title: "Result Validation", description: "Verify tool execution completed successfully. Confirm state changes in the browser and report back to the user." },
  { title: "Continuous Learning", description: "Analyze conversation outcomes to improve tool selection, response quality, and resolution rates over time." },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  show: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.7, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

export default function PlatformContent() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.7], ["0%", "100%"]);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-36 pb-20 px-6">
        <div className="absolute inset-0 aurora opacity-50" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-5">Platform</span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight leading-[1.1] mb-6">
              Define. Deploy.<br />
              <span className="gradient-text">Let the browser execute.</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              Zephlo&apos;s platform turns your product into an AI-powered experience.
              Define tools, deploy the widget, and let conversations drive actions
              directly in the user&apos;s browser.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Flywheel — Numbered Feature Sections */}
      <section ref={sectionRef} className="relative py-24 sm:py-40 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">How It Works</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
              Four stages.<br />
              <span className="gradient-text">One seamless loop.</span>
            </h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-[27px] top-4 bottom-4 w-px bg-[var(--subtle-white-04)] hidden sm:block">
              <motion.div style={{ height: lineHeight }} className="w-full bg-gradient-to-b from-[var(--accent)] to-[var(--accent-light)] rounded-full" />
            </div>

            <div className="flex flex-col gap-20">
              {flywheel.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, delay: i * 0.1, ease: "easeOut" as const }}
                    className="relative flex gap-6 sm:gap-12"
                  >
                    <div className="flex-shrink-0 relative z-10">
                      <span className="text-3xl sm:text-5xl font-bold gradient-text font-[family-name:var(--font-geist-mono)]">{step.number}</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--icon-bg)" }}>
                          <Icon className="h-4.5 w-4.5 text-[var(--accent)]" />
                        </div>
                        <h3 className="text-lg sm:text-2xl font-semibold text-[var(--foreground)]">{step.title}</h3>
                        {step.badge && (
                          <span className="inline-flex items-center rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/[0.06] px-2.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">{step.badge}</span>
                        )}
                      </div>
                      <p className="text-[13px] font-medium text-[var(--accent)] mb-2">{step.subtitle}</p>
                      <p className="text-sm sm:text-base leading-relaxed text-[var(--muted)] max-w-lg">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* AI Technology Pipeline */}
      <section className="relative py-24 sm:py-40 px-6 overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">AI Technology</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
              Engineered for<br />
              <span className="gradient-text">precision and reliability.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {techPipeline.map((phase, i) => (
              <motion.div
                key={phase.title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="group rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-7 flex flex-col gap-3 transition-all duration-500 hover:border-[var(--accent)]/15 hover:bg-[var(--card-hover)]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[var(--accent)] opacity-60">0{i + 1}</span>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">{phase.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-[var(--muted)]">{phase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section className="relative py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-2xl border border-[var(--accent)]/15 bg-[var(--accent)]/[0.02] p-10 sm:p-14 text-center"
          >
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--icon-bg)" }}>
              <Shield className="h-7 w-7 text-[var(--accent)]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Security by architecture, not by policy.
            </h2>
            <p className="text-base text-[var(--muted)] max-w-xl mx-auto mb-8 leading-relaxed">
              Tools execute in the user&apos;s browser. Credentials never leave the session.
              There&apos;s nothing to store, nothing to breach, nothing to proxy.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
              {[
                { title: "No credentials stored", desc: "Authentication stays entirely in the browser. Zephlo never sees tokens or passwords." },
                { title: "No screen scraping", desc: "Tools are defined by you and scoped to specific actions. No DOM reading or data extraction." },
                { title: "You define boundaries", desc: "Full control over which tools the agent can use. You decide exactly what actions are possible." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl bg-[var(--subtle-white-03)] border border-[var(--subtle-white-04)] p-5">
                  <p className="text-[13px] font-semibold text-[var(--foreground)] mb-1.5">{item.title}</p>
                  <p className="text-[12px] text-[var(--muted)] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Analytics Preview */}
      <section className="relative py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">Analyze</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15]">
              Measure everything.<br />
              <span className="gradient-text">Improve continuously.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: BarChart3, title: "Resolution analytics", desc: "Track resolution rates, conversation volumes, and agent performance across all channels." },
              { icon: MessageCircle, title: "Conversation insights", desc: "Understand what users ask for, where they struggle, and which tools drive the most value." },
              { icon: Settings, title: "Tool optimization", desc: "See which tools are used most, where executions fail, and get suggestions to improve your setup." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="group rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-7 transition-all duration-500 hover:border-[var(--accent)]/15 hover:bg-[var(--card-hover)]"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--icon-bg)" }}>
                    <Icon className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
                </motion.div>
              );
            })}
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
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
              Ready to see it in action?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href={links.signUp} className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
                Start free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
              <a href={links.sales} className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--subtle-white-06)] px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-all duration-300 hover:bg-[var(--subtle-white-03)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
                Talk to sales
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
