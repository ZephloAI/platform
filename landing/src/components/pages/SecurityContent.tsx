"use client";

import { motion } from "framer-motion";
import { ease } from "@/lib/motion";
import { ArrowRight, Lock, KeyRound, Users, ShieldCheck, Database, EyeOff, FileCheck, ClipboardCheck } from "lucide-react";
import { links } from "@/lib/links";

const pillars = [
  {
    icon: Lock,
    title: "Conversations encrypted end-to-end",
    description: "Every message between user, Agent, and your dashboard travels over TLS 1.3. At rest, conversation data is encrypted with AES-256. Keys are managed by AWS KMS and rotated automatically.",
  },
  {
    icon: KeyRound,
    title: "Stored safely, segregated by tenant",
    description: "Each organization's data lives in a logically isolated tenant. Conversations, embeddings, and tool definitions never cross boundaries. Backups are encrypted and access-logged.",
  },
  {
    icon: Users,
    title: "Role-based access control",
    description: "Owners, admins, editors, and viewers — each role has a tightly-scoped set of permissions. Invite teammates with the access they need, nothing more. Every privilege change is audited.",
  },
  {
    icon: EyeOff,
    title: "No credential proxying",
    description: "Tools run inside the user's own browser session. Zephlo never sees passwords, tokens, or session cookies. Your users authenticate with you — not with us.",
  },
  {
    icon: Database,
    title: "Granular data retention",
    description: "Set retention windows per organization, per channel. Purge conversations on demand. Export your data anytime in a portable format. We don't hold what you don't want held.",
  },
  {
    icon: ShieldCheck,
    title: "Defense in depth",
    description: "WAF, rate limiting, anomaly detection, and audit logging across the stack. Production access requires SSO + MFA. Dependencies are continuously scanned for vulnerabilities.",
  },
];

const compliance = [
  {
    title: "SOC 2 Type II",
    status: "In progress",
    description:
      "Audit underway. Controls for security, availability, confidentiality, and processing integrity are implemented; we expect attestation in 2026.",
  },
  {
    title: "GDPR",
    status: "In progress",
    description:
      "Data Processing Agreements available on request. EU data residency options on the roadmap. We act as a processor on behalf of your organization.",
  },
  {
    title: "HIPAA",
    status: "Certification underway",
    description:
      "Working toward HIPAA-aligned controls and a signable BAA for healthcare customers. Today, sensitive deployments run in tightly scoped, opt-in environments.",
  },
];

const accessControls = [
  "SSO via SAML and OIDC (Enterprise)",
  "MFA enforced for all dashboard sign-ins",
  "Per-role permissions: Owner, Admin, Editor, Viewer",
  "Invitation-only org membership with email verification",
  "Full audit log of access, role changes, and configuration edits",
  "API keys scoped per-environment with one-click rotation",
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

export default function SecurityContent() {
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
              Security
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight leading-[1.1] mb-6">
              Built so security teams<br />
              <span className="gradient-text">say yes.</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              Conversations stored safely. Access role-based. Compliance work
              underway. Zephlo is engineered so the parts of your business that
              need to move fast don&apos;t get blocked by the parts that need to
              move carefully.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={links.sales}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
              >
                Talk to security
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
              <a
                href="#compliance"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--subtle-white-06)] px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-all duration-300 hover:bg-[var(--subtle-white-03)] hover:border-[var(--subtle-white-hover)]"
              >
                Compliance status
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pillars */}
      <section className="relative py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: ease.out }}
            className="text-center mb-20"
          >
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">How your data is protected</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
              Encrypted in transit.<br />
              <span className="gradient-text">Encrypted at rest.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
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
                  <h3 className="text-base font-semibold text-[var(--foreground)]">{pillar.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted)]">{pillar.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Access Control */}
      <section className="relative py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="rounded-3xl border border-[var(--subtle-white)] bg-[var(--card)] p-10 sm:p-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-start"
          >
            <div className="flex flex-col gap-5">
              <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--page-accent)]">Access control</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15]">
                Role-based,<br />
                <span className="gradient-text">audited end-to-end.</span>
              </h2>
              <p className="text-base text-[var(--muted)] leading-relaxed">
                Every action in Zephlo is gated by role. Every access decision is
                logged. You know who saw what, who changed what, and when —
                without piecing it together from disparate systems.
              </p>
            </div>

            <ul className="flex flex-col gap-3.5">
              {accessControls.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--foreground)]">
                  <div className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--page-accent-soft)" }}>
                    <ClipboardCheck className="h-3 w-3 text-[var(--page-accent)]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Compliance */}
      <section id="compliance" className="relative py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">Compliance</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
              Where we are<br />
              <span className="gradient-text">on the journey.</span>
            </h2>
            <p className="mt-6 text-base text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              We&apos;re upfront about what&apos;s certified, what&apos;s in
              progress, and what&apos;s coming. No theatre, no badges we
              haven&apos;t earned.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {compliance.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-7 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--page-accent)]"
                    style={{ background: "var(--page-accent-soft)" }}
                  >
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--page-accent)]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--page-accent)" }} />
                    {item.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 text-center text-[12px] text-[var(--muted)]/80"
          >
            Need a DPA, BAA, or our latest security questionnaire? Reach out — we share what we have, when we have it.
          </motion.p>
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
              Have a security review?
            </h2>
            <p className="text-base text-[var(--muted)] max-w-md">
              Send it our way. We&apos;ll respond with detailed answers and the
              latest documentation — usually within a business day.
            </p>
            <a
              href={links.sales}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
            >
              Contact security
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}
