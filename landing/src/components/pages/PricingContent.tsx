"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { links } from "@/lib/links";

const plans = [
  {
    name: "Starter",
    price: "Free",
    priceDetail: "up to 50 conversations",
    description: "Try Zephlo with your product. No credit card required.",
    cta: "Start Free",
    ctaStyle: "secondary" as const,
    features: [
      "1 agent",
      "5 tools",
      "Web widget channel",
      "Basic analytics",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$0.99",
    priceDetail: "per resolved conversation",
    description: "For teams ready to deploy AI agents at scale.",
    cta: "Start Free Trial",
    ctaStyle: "primary" as const,
    popular: true,
    features: [
      "Unlimited agents",
      "Unlimited tools",
      "All channels (web, WhatsApp, Telegram, mobile)",
      "Advanced analytics & insights",
      "Custom branding",
      "Priority support",
      "Team collaboration",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceDetail: "volume-based pricing",
    description: "For organizations with advanced security and scale needs.",
    cta: "Contact Sales",
    ctaStyle: "secondary" as const,
    features: [
      "Everything in Pro",
      "SSO & SAML",
      "Dedicated account manager",
      "Custom SLA",
      "Advanced compliance (SOC 2, HIPAA)",
      "On-premise deployment option",
      "Professional services",
    ],
  },
];

const faqs = [
  { q: "What counts as a resolved conversation?", a: "A conversation is resolved when the AI agent successfully completes the user\u2019s request without needing human escalation. You only pay for outcomes, not messages." },
  { q: "Do I need to change my backend?", a: "No. Zephlo tools run client-side in the user\u2019s browser. You define tools that interact with your existing UI \u2014 no API integrations or backend modifications needed." },
  { q: "How does the free trial work?", a: "Start with 50 free conversations on the Pro plan. No credit card required. If you love it, upgrade to continue. Your setup and tools carry over." },
  { q: "What channels does Zephlo support?", a: "Web widget, WhatsApp, Telegram, and mobile SDK. Users can chat from any channel while tools execute in a connected browser session." },
  { q: "Is my users\u2019 data safe?", a: "Absolutely. Tools run in the user\u2019s own browser session. Zephlo never sees, stores, or proxies user credentials. Nothing leaves the browser." },
  { q: "How long does setup take?", a: "Most teams are live within a day. Define your tools, add the script tag, and you\u2019re ready. No SDK, no API keys, no OAuth setup." },
];

export default function PricingContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-36 pb-16 px-6">
        <div className="absolute inset-0 aurora opacity-50" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-5">Pricing</span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight leading-[1.1] mb-6">
              Pay per outcome,<br />
              <span className="gradient-text">not per message.</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--muted)] max-w-xl mx-auto">
              Simple, transparent pricing. Only pay when the AI agent successfully resolves a conversation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: i * 0.12 }}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  plan.popular
                    ? "border-[var(--accent)]/20 bg-[var(--accent)]/[0.02] gradient-border"
                    : "border-[var(--subtle-white)] bg-[var(--card)]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-[var(--accent)] px-3 py-0.5 text-[11px] font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[var(--foreground)]">{plan.price}</span>
                    {plan.priceDetail && <span className="text-[12px] text-[var(--muted)]">/ {plan.priceDetail}</span>}
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-2">{plan.description}</p>
                </div>

                <a
                  href={plan.name === "Enterprise" ? links.sales : links.signUp}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 mb-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                    plan.ctaStyle === "primary"
                      ? "bg-[#1275CA] text-white hover:bg-[#0E5FA6] hover:shadow-[0_0_24px_-4px_rgba(18,117,202,0.5)]"
                      : "border border-[var(--subtle-white-06)] text-[var(--foreground)] hover:bg-[var(--subtle-white-03)]"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>

                <ul className="flex flex-col gap-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-[var(--muted)]">
                      <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--check-color)" }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparent Pricing */}
      <section className="relative py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15]">
              Transparent by design.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { title: "Outcome-based", desc: "Only pay when Zephlo resolves a conversation. Failed attempts and escalations are free." },
              { title: "Built-in controls", desc: "Set monthly caps, track spend in real-time, and scale up or down whenever you need." },
              { title: "No hidden fees", desc: "No setup costs, no per-seat charges, no channel fees. What you see is what you pay." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-7"
              >
                <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
          </motion.div>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="rounded-xl border border-[var(--subtle-white)] bg-[var(--card)] px-6 py-5"
              >
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">{faq.q}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{faq.a}</p>
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
              Get started for free.
            </h2>
            <p className="text-base text-[var(--muted)] max-w-md">
              50 free conversations. No credit card. No backend changes. Deploy an AI agent in minutes.
            </p>
            <a href={links.signUp} className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
              Start free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}
