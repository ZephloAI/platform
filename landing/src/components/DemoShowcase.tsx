"use client";

import { motion } from "framer-motion";
import { Stethoscope, Car, Scale, IdCard, ArrowRight, type LucideIcon } from "lucide-react";

type Demo = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
};

const demos: Demo[] = [
  {
    title: "Healthcare Intake",
    description:
      "Gather patient history and insurance details through empathetic dialogue.",
    icon: Stethoscope,
    href: "#",
  },
  {
    title: "Insurance Claims",
    description:
      "Automate accident reporting with image uploads and location tagging.",
    icon: Car,
    href: "#",
  },
  {
    title: "Legal Client Intake",
    description:
      "Qualify leads and schedule consultations based on case complexity.",
    icon: Scale,
    href: "#",
  },
  {
    title: "HR Onboarding",
    description:
      "Guided collection of tax docs, direct deposit, and equipment preferences.",
    icon: IdCard,
    href: "#",
  },
];

export default function DemoShowcase() {
  return (
    <section className="relative py-28 sm:py-32 px-6">
      <div className="mx-auto max-w-7xl space-y-16">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" as const }}
            className="space-y-4"
          >
            <h2 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Built for <span className="italic text-[var(--accent)]">Real</span> Workflows
            </h2>
            <p className="max-w-lg text-xl text-[var(--muted)]">
              Click any demo to try it live — no signup required.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {demos.map((demo, i) => (
            <DemoCard key={demo.title} demo={demo} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoCard({ demo, index }: { demo: Demo; index: number }) {
  const Icon = demo.icon;
  return (
    <motion.a
      href={demo.href}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: "easeOut" as const }}
      className="group relative flex flex-col gap-6 rounded-2xl border border-[var(--subtle-white-06)] bg-[var(--card)] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/30 hover:bg-[var(--card-hover)]"
      style={{ boxShadow: "0 20px 40px -24px var(--shadow-color)" }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--icon-bg)] text-[var(--accent)] transition-transform duration-300 group-hover:scale-110">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {demo.title}
        </h3>
        <p className="text-[13px] leading-relaxed text-[var(--muted)]">{demo.description}</p>
      </div>

      <div className="mt-auto flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent)]">
        Try it
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </motion.a>
  );
}
