"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, MousePointerClick, Video, Plug, Headphones, LogOut } from "lucide-react";
import { useRef } from "react";
import type { ReactNode } from "react";

interface ProblemCard {
  title: string;
  description: string;
  icon: ReactNode;
}

const cards: ProblemCard[] = [
  {
    title: "Tooltip tours nobody finishes",
    description:
      "Step-by-step tooltips that explain buttons users can already see. Most abandon before step 4.",
    icon: <MousePointerClick className="h-5 w-5" />,
  },
  {
    title: "Docs and videos they skip",
    description:
      "Hours of content that still requires users to do all the work themselves. Nobody watches past minute two.",
    icon: <Video className="h-5 w-5" />,
  },
  {
    title: "Setup wizards with 47 clicks",
    description:
      "Multi-step forms that feel like filing taxes. Users give up before reaching the features that matter.",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "API automations that take months",
    description:
      "Building onboarding automation through APIs means OAuth, credential management, and months of engineering.",
    icon: <Plug className="h-5 w-5" />,
  },
  {
    title: "Support tickets on repeat",
    description:
      "Your team answers the same setup questions hundreds of times. Expensive, slow, and doesn\u2019t scale.",
    icon: <Headphones className="h-5 w-5" />,
  },
  {
    title: "Users churn before activation",
    description:
      "They signed up because your product solves their problem. They left because onboarding didn\u2019t.",
    icon: <LogOut className="h-5 w-5" />,
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
      delay: i * 0.1,
      ease: "easeOut" as const,
    },
  }),
};

export default function OnboardingProblem() {
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
            The Onboarding Problem
          </motion.span>
          <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
            Your product is powerful.
            <br />
            <span className="gradient-text">Your onboarding is the bottleneck.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              <h3 className="text-base font-semibold text-[var(--foreground)]">
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
            What if onboarding was{" "}
            <span className="gradient-text">a conversation, not a chore?</span>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
