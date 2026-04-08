"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState, useRef } from "react";

const steps = [
  { number: "01", title: "Define your tools", description: "Describe what actions Zephlo can take in your product \u2014 clicks, form fills, navigation, settings changes. Each tool is a simple function definition. No SDK required." },
  { number: "02", title: "Drop in the widget", description: "One script tag. Zephlo appears as a chat interface on your site. Users can also connect via WhatsApp, Telegram, or your mobile app." },
  { number: "03", title: "Users just talk", description: "\u201CSet up my dashboard with sales metrics and invite my team.\u201D Users describe what they want in plain language. Zephlo understands intent and maps it to your tools." },
  { number: "04", title: "Watch it happen", description: "Zephlo executes actions directly in the connected browser session. Users see their product configure itself in real time. Complex onboarding becomes a 2-minute conversation." },
];

const codeSnippet = `<script src="https://cdn.zephlo.ai/widget.js" data-key="your-key"></script>`;

function CodeBlock() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(codeSnippet); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-5 rounded-xl border border-[var(--subtle-white-06)] bg-[var(--code-bg)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--subtle-white-04)]">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]/60" />
        </div>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          {copied ? (<><Check className="h-3.5 w-3.5" style={{ color: "var(--emerald)" }} /><span style={{ color: "var(--emerald)" }}>Copied</span></>) : (<><Copy className="h-3.5 w-3.5" />Copy</>)}
        </button>
      </div>
      <div className="px-4 py-3.5 overflow-x-auto">
        <pre className="text-[12px] sm:text-[13px] font-[family-name:var(--font-geist-mono)] text-[var(--foreground)] opacity-70 whitespace-pre-wrap break-all sm:whitespace-nowrap sm:break-normal">
          <code>{codeSnippet}</code>
        </pre>
      </div>
    </motion.div>
  );
}

export default function OnboardingHowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.7], ["0%", "100%"]);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative py-24 sm:py-40 px-6">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="text-center mb-24"
        >
          <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">How It Works</span>
          <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
            Four steps.<br />
            <span className="gradient-text">Zero friction.</span>
          </h2>
        </motion.div>

        <div className="relative">
          <div className="absolute left-[27px] top-4 bottom-4 w-px bg-[var(--subtle-white-04)] hidden sm:block">
            <motion.div style={{ height: lineHeight }} className="w-full bg-gradient-to-b from-[var(--accent)] to-[var(--accent-light)] rounded-full" />
          </div>

          <div className="flex flex-col gap-20">
            {steps.map((step, i) => (
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
                  <h3 className="text-lg sm:text-2xl font-semibold text-[var(--foreground)] mb-3">{step.title}</h3>
                  <p className="text-sm sm:text-base leading-relaxed text-[var(--muted)] max-w-lg">{step.description}</p>
                  {step.number === "02" && <CodeBlock />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
