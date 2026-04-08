"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
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
            See Zephlo<br />
            <span className="gradient-text">in action.</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--muted)] max-w-lg">
            Get a personalized walkthrough of how Zephlo can transform your product experience &mdash; no commitment required.
          </p>
          <a
            href="#contact"
            className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)]"
          >
            Request a Demo
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
