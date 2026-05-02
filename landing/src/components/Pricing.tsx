"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ease, duration } from "@/lib/motion";

const valueProps = [
  "Pricing tailored to your scale and channels",
  "Hands-on onboarding with a dedicated engineer",
  "Volume discounts and flexible billing",
  "SOC 2 / GDPR / HIPAA paths for regulated teams",
];

export default function Pricing() {
  const reduce = useReducedMotion();
  const [form, setForm] = useState({ name: "", email: "", company: "", goal: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("Pricing inquiry:", form);
    setSubmitted(true);
  }

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <section id="pricing" className="relative px-6 py-24 sm:py-40">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(18,117,202,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: ease.out }}
          className="mb-6 text-center"
        >
          <span className="mb-5 inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            Pricing
          </span>
          <h2 className="text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-[3.25rem]">
            Pricing built<br />
            <span className="gradient-text">around your business.</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mb-16 max-w-xl text-center text-base text-[var(--muted)]"
        >
          Every team has different volumes, channels, and integrations. Tell us a
          little about yours and we&apos;ll send a plan that fits — no
          one-size-fits-all sticker price.
        </motion.p>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: duration.signature, ease: ease.out }}
          className="mx-auto max-w-5xl rounded-3xl gradient-border bg-[var(--card)] p-8 sm:p-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            <div className="flex flex-col gap-5">
              <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
                Talk to us
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight leading-[1.2]">
                Share a few details.<br />
                We&apos;ll come back with the right plan.
              </h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Most teams hear back within one business day. We use your info to
                shape the conversation, never to spam you.
              </p>

              <ul className="mt-2 flex flex-col gap-3">
                {valueProps.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm leading-relaxed text-[var(--foreground)]"
                  >
                    <div
                      className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "var(--icon-bg)" }}
                    >
                      <Check className="h-3 w-3 text-[var(--accent)]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--subtle-white-06)] bg-[var(--background)]/40 p-6 sm:p-8">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center text-center gap-4 py-6"
                >
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center"
                    style={{ background: "var(--icon-bg)" }}
                  >
                    <Send className="h-6 w-6 text-[var(--accent)]" />
                  </div>
                  <h4 className="text-xl font-semibold text-[var(--foreground)]">
                    Got it — talk soon.
                  </h4>
                  <p className="text-sm text-[var(--muted)] max-w-sm">
                    We&apos;ll review your details and reply with a tailored plan
                    within one business day.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Field
                    label="Name"
                    type="text"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={(v) => update("name", v)}
                    required
                  />
                  <Field
                    label="Work email"
                    type="email"
                    placeholder="jane@company.com"
                    value={form.email}
                    onChange={(v) => update("email", v)}
                    required
                  />
                  <Field
                    label="Company"
                    type="text"
                    placeholder="Company name"
                    value={form.company}
                    onChange={(v) => update("company", v)}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-[var(--foreground)]">
                      What are you hoping to do?
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={form.goal}
                      onChange={(e) => update("goal", e.target.value)}
                      placeholder="e.g. capture leads on our marketing site, automate onboarding, deflect support…"
                      className="w-full rounded-xl border border-[var(--subtle-white-06)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] placeholder:opacity-50 outline-none focus:border-[var(--accent)]/40 transition-colors duration-300 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1275CA] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
                  >
                    Get a tailored plan
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>

                  <p className="text-[11px] text-[var(--muted)] opacity-60 text-center">
                    No credit card. No spam. We respond within one business day.
                  </p>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-[var(--foreground)]">
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--subtle-white-06)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] placeholder:opacity-50 outline-none focus:border-[var(--accent)]/40 transition-colors duration-300"
      />
    </div>
  );
}
