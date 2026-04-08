"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Plug, Bug, KeyRound } from "lucide-react";
import { useRef } from "react";
import type { ReactNode } from "react";

interface ProblemCard {
  title: string;
  description: string;
  icon: ReactNode;
}

const cards: ProblemCard[] = [
  {
    title: "\u201CWe\u2019ll call your APIs\u201D",
    description:
      "Weeks of backend integration, OAuth setup, token management. Every new app means starting over from scratch.",
    icon: <Plug className="h-5 w-5" />,
  },
  {
    title: "\u201CWe\u2019ll click for you\u201D",
    description:
      "Screen scraping and browser automation that breaks constantly. Fragile, slow, and a security nightmare.",
    icon: <Bug className="h-5 w-5" />,
  },
  {
    title: "\u201CStore your credentials\u201D",
    description:
      "Hand over your passwords and tokens to a third party. One breach away from disaster.",
    icon: <KeyRound className="h-5 w-5" />,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      delay: i * 0.15,
      ease: "easeOut" as const,
    },
  }),
};

export default function Problem() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={ref} id="problem" className="relative py-24 sm:py-40 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="text-center mb-20"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5"
          >
            The Problem
          </motion.span>
          <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
            Every AI agent platform
            <br />
            <span className="gradient-text">makes the same mistakes.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="group rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-7 flex flex-col gap-5 transition-all duration-500 hover:border-[var(--red-icon-bg-hover)] hover:bg-[var(--card-hover)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300" style={{ background: "var(--red-icon-bg)", color: "var(--red-icon-text)" }}>
                {card.icon}
              </div>
              <h3 className="text-lg font-semibold italic text-[var(--foreground)]">
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div style={{ y }} className="mt-20 sm:mt-28">
          <motion.p
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: "easeOut" as const }}
            className="text-center text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight"
          >
            What if the tools ran{" "}
            <span className="gradient-text">in the user&apos;s own browser?</span>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
