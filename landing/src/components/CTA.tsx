"use client";

import { motion } from "framer-motion";
import { type FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("Waitlist signup:", email);
    setEmail("");
  }

  return (
    <section id="get-started" className="relative py-24 sm:py-40 px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px]" style={{ background: "radial-gradient(ellipse at center, rgba(18,117,202,0.08) 0%, rgba(96,165,250,0.04) 40%, transparent 70%)" }} />

      <div className="relative z-10 mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="rounded-3xl gradient-border bg-[var(--card)] p-10 sm:p-16 text-center flex flex-col items-center gap-7"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
            Stop building integrations.<br />
            <span className="gradient-text">Start shipping agents.</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--muted)] max-w-lg">
            Get early access to Zephlo. Define your first tools and deploy an AI agent in minutes &mdash; no backend work required.
          </p>
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 flex w-full max-w-md flex-col sm:flex-row items-center gap-3"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full flex-1 rounded-full border border-[var(--subtle-white-06)] bg-[var(--background)] px-5 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] opacity-50 placeholder:opacity-100 outline-none focus:border-[var(--accent)]/40 transition-colors duration-300"
            />
            <button
              type="submit"
              className="group w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-7 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
            >
              Join Waitlist
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </motion.form>
          <p className="text-[12px] text-[var(--muted)] opacity-40 mt-1">No credit card required. Cancel anytime.</p>
        </motion.div>
      </div>
    </section>
  );
}
