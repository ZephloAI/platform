"use client";

import { motion } from "framer-motion";
import { ease } from "@/lib/motion";
import { Play } from "lucide-react";

export default function VideoDemo() {
  return (
    <section id="video" className="relative py-28 sm:py-32 px-6">
      <div className="mx-auto max-w-5xl space-y-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: ease.out }}
          className="space-y-4"
        >
          <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            See It In Action
          </h2>
          <p className="mx-auto max-w-xl text-lg text-[var(--muted)]">
            60 seconds. Complex form → simple conversation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: ease.out }}
          className="group relative aspect-video overflow-hidden rounded-2xl border border-[var(--subtle-white-06)] bg-[var(--card)]"
          style={{ boxShadow: "0 40px 100px -30px var(--shadow-color)" }}
        >
          {/* Ambient video placeholder texture */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 dot-pattern" />
            <div className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]/20 blur-[60px] md:blur-[120px]" />
          </div>

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              aria-label="Play demo"
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#1275CA] text-white shadow-[0_20px_60px_-12px_rgba(18,117,202,0.7)] transition-transform duration-300 hover:scale-110 active:scale-95"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-[#1275CA]/40" />
              <Play className="relative h-8 w-8 translate-x-0.5 fill-white" strokeWidth={0} />
            </button>
          </div>

          {/* Corner label */}
          <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-[var(--subtle-white-06)] bg-[var(--card)]/80 px-3 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
              Live product walkthrough
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
