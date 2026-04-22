"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { links } from "@/lib/links";

interface PricingTier { name: string; badge: string; price: ReactNode; description: string; features: string[]; cta: string; href: string; highlighted?: boolean }

const tiers: PricingTier[] = [
  {
    name: "Starter", badge: "Free",
    price: (<><span className="text-4xl sm:text-5xl font-bold text-[var(--foreground)]">$0</span><span className="text-sm text-[var(--muted)] ml-1">/month</span></>),
    description: "Perfect for trying things out",
    features: ["1 agent", "100 conversations/mo", "Community support", "Basic analytics"],
    cta: "Start free", href: links.signUp,
  },
  {
    name: "Pro", badge: "Most Popular",
    price: (<><span className="text-4xl sm:text-5xl font-bold text-[var(--foreground)]">$49</span><span className="text-sm text-[var(--muted)] ml-1">/month</span></>),
    description: "For teams ready to scale",
    features: ["Unlimited agents", "Unlimited conversations", "Priority support", "Advanced analytics", "Custom branding", "API access"],
    cta: "Start Pro trial", href: links.signUp, highlighted: true,
  },
  {
    name: "Enterprise", badge: "Custom",
    price: (<span className="text-4xl sm:text-5xl font-bold text-[var(--foreground)]">Let&rsquo;s talk</span>),
    description: "For large-scale deployments",
    features: ["Everything in Pro", "SSO & SAML", "Dedicated support", "SLA guarantee", "Custom integrations", "On-premise option"],
    cta: "Contact sales", href: links.sales,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.7, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-40 px-6">
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[400px]" style={{ background: "radial-gradient(ellipse at center, rgba(18,117,202,0.04) 0%, transparent 70%)" }} />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="text-center mb-6"
        >
          <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">Pricing</span>
          <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
            Start free.<br />
            <span className="gradient-text">Scale as you grow.</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-base text-[var(--muted)] mb-20 max-w-lg mx-auto"
        >
          We&rsquo;re in early access &mdash; simple, transparent pricing.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className={`relative rounded-2xl p-8 flex flex-col gap-6 transition-all duration-500 ${
                tier.highlighted
                  ? "gradient-border bg-[var(--card)] glow"
                  : "border border-[var(--subtle-white)] bg-[var(--card)] hover:border-[var(--accent)]/10 hover:bg-[var(--card-hover)]"
              }`}
            >
              <span className={`inline-flex self-start rounded-full px-3 py-1 text-[11px] font-medium ${tier.highlighted ? "bg-[#1275CA] text-white" : "bg-[var(--subtle-white-03)] text-[var(--muted)] border border-[var(--subtle-white-06)]"}`}>
                {tier.badge}
              </span>
              <div>{tier.price}</div>
              <p className="text-sm text-[var(--muted)]">{tier.description}</p>
              <div className="h-px bg-[var(--subtle-white)]" />
              <ul className="flex flex-col gap-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-[var(--foreground)]">
                    <Check className="h-4 w-4 shrink-0" style={{ color: "var(--check-color)" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <a href={tier.href} className={`mt-2 inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${tier.highlighted ? "bg-[#1275CA] text-white hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.4)]" : "border border-[var(--subtle-white-06)] text-[var(--foreground)] hover:bg-[var(--subtle-white-03)] hover:border-[var(--subtle-white-hover)]"}`}>
                {tier.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
