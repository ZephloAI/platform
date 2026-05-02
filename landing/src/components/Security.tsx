"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, Lock, EyeOff, ShieldCheck, Settings } from "lucide-react";
import { useRef } from "react";
import type { ReactNode } from "react";
import { ease } from "@/lib/motion";

const points: { title: string; description: string; icon: ReactNode }[] = [
  { title: "Tools run in-browser", description: "Every tool executes in the user\u2019s own browser session. Nothing routes through Zephlo\u2019s servers.", icon: <Shield className="h-5 w-5" /> },
  { title: "No credentials stored", description: "We never see, store, or proxy user credentials. Authentication stays entirely in the browser.", icon: <Lock className="h-5 w-5" /> },
  { title: "No screen scraping", description: "Zephlo doesn\u2019t read or extract screen data. Tools are defined by you and scoped to specific actions.", icon: <EyeOff className="h-5 w-5" /> },
  { title: "Compliance ready", description: "Security audit in progress. SOC 2 on our roadmap.", icon: <ShieldCheck className="h-5 w-5" /> },
  { title: "You define the boundaries", description: "You decide exactly which tools the agent can use. Full control over what actions are possible.", icon: <Settings className="h-5 w-5" /> },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.7, delay: i * 0.08, ease: ease.out },
  }),
};

export default function Security() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const glowOpacity = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 0.6, 0]);

  return (
    <section ref={ref} id="security" className="relative py-24 sm:py-40 px-6">
      <motion.div style={{ opacity: glowOpacity }} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px]">
        <div className="w-full h-full" style={{ background: "radial-gradient(ellipse at center, rgba(18,117,202,0.06) 0%, transparent 70%)" }} />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: ease.out }}
          className="text-center mb-20"
        >
          <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-5">Security</span>
          <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
            Your data<br />
            <span className="gradient-text">never leaves the browser.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {points.map((point, i) => (
            <motion.div
              key={point.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="group rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-7 flex flex-col gap-4 transition-all duration-500 hover:border-[var(--accent)]/15 hover:bg-[var(--card-hover)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--accent)] transition-colors duration-300" style={{ background: "var(--icon-bg)" }}>
                {point.icon}
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">{point.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">{point.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
