"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { links } from "@/lib/links";
import { ease, duration, stagger } from "@/lib/motion";

const heroParent = {
  hidden: {},
  show: {
    transition: { staggerChildren: stagger.default, delayChildren: 0.05 },
  },
};

const heroChild = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: duration.signature, ease: ease.out },
  },
};

/**
 * Live `<zephlo-chat>` panel. Fills the host box via the widget's
 * internal styling. Dimensions mirror the previous mockup:
 *   width: up to 540px (inherits from wrapper)
 *   height: ~556px on desktop, tighter on small screens
 * Explicit sizing keeps layout stable before the SDK hydrates (no CLS).
 */
function LiveChatPreview() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.95, delay: 0.35, ease: ease.out }}
      whileHover={reduce ? undefined : { y: -4, transition: { duration: 0.4, ease: ease.out } }}
      className="relative group w-4/5 max-w-[512px] mx-auto lg:mx-0 lg:mr-auto"
      aria-label="Live embedded Zephlo Agent"
    >
      <div
        className="absolute -inset-8 -z-10 rounded-[48px] bg-[var(--accent)]/[0.10] blur-3xl scale-75 group-hover:scale-100 transition-transform duration-700"
        aria-hidden="true"
      />
      <div
        className="relative h-[540px] w-full overflow-hidden rounded-2xl sm:h-[660px]"
        style={{ boxShadow: "0 40px 80px -24px var(--shadow-color)" }}
      >
        <zephlo-chat
          data-zephlo-inline=""
          style={{
            display: "block",
            position: "relative",
            inset: "auto",
            width: "100%",
            height: "100%",
            ["--cb-panel-width" as string]: "100%",
            ["--cb-panel-height" as string]: "100%",
          }}
        />
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      className="relative flex min-h-[calc(100svh-72px)] items-center overflow-hidden px-6 pt-24 pb-16 sm:pt-40 sm:pb-32"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
        <div className="absolute left-[-10%] top-[-20%] h-[60%] w-[55%] rounded-full bg-[var(--accent)]/[0.10] blur-[80px] md:blur-[160px]" />
        <div className="absolute right-[-10%] top-[30%] h-[50%] w-[45%] rounded-full bg-[#60A5FA]/[0.06] blur-[80px] md:blur-[160px]" />
      </div>
      <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2 xl:gap-24">
        <motion.div
          variants={heroParent}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-9"
        >
          <motion.div variants={heroChild}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-1.5 text-[12px] text-[var(--muted)] backdrop-blur-sm">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: "var(--emerald)" }}
                aria-hidden="true"
              />
              The Agent platform for any website
            </span>
          </motion.div>

          <motion.h1
            variants={heroChild}
            className="font-serif text-[2.75rem] font-semibold leading-[1.04] tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-[5rem]"
          >
            Turn your website
            <br className="hidden sm:block" /> into an{" "}
            <span className="gradient-text italic">Agent</span>.
          </motion.h1>

          <motion.p
            variants={heroChild}
            className="max-w-xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl"
          >
            Point Zephlo at a URL. We crawl, embed, and ground a conversational Agent in
            your content — then drop it on your site with one script tag. It answers, it
            navigates, it takes action on your visitor&apos;s behalf.
          </motion.p>

          <motion.div
            variants={heroChild}
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            <motion.a
              whileHover={reduce ? undefined : { y: -2 }}
              whileTap={reduce ? undefined : { y: 0, scale: 0.985 }}
              transition={{ duration: duration.feedback, ease: ease.out }}
              href={links.signUp}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#1275CA] px-7 py-4 text-[15px] font-semibold text-white transition-shadow duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_48px_-6px_rgba(18,117,202,0.65)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Start free
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </motion.a>
            <motion.a
              whileHover={reduce ? undefined : { y: -2 }}
              whileTap={reduce ? undefined : { y: 0, scale: 0.985 }}
              transition={{ duration: duration.feedback, ease: ease.out }}
              href={links.sales}
              className="group inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-7 py-4 text-[15px] font-semibold text-[var(--foreground)] transition-colors duration-300 hover:bg-[var(--subtle-white-06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Talk to sales
            </motion.a>
          </motion.div>

          <motion.p
            variants={heroChild}
            className="text-[12px] text-[var(--muted)]/80"
          >
            Free to start · No credit card · Live in under 5 minutes
          </motion.p>
        </motion.div>

        <motion.div
          className="w-full"
        >
          <LiveChatPreview />
        </motion.div>
      </div>
    </section>
  );
}
