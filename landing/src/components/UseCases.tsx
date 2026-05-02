"use client";

import { motion } from "framer-motion";
import {
  Rocket,
  Headphones,
  Building2,
  ShoppingCart,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { ease } from "@/lib/motion";

type UseCase = {
  icon: typeof Rocket;
  title: string;
  description: string;
  href?: string;
  featured?: boolean;
  /** Wrapper class applying that page's accent on the card. */
  themeClass?: string;
};

const useCases: UseCase[] = [
  {
    icon: UserCheck,
    title: "Lead Generation",
    description:
      "Capture and qualify leads through natural conversation, 24/7. The Agent answers in seconds, fills your CRM, and books meetings — all within the visitor’s session.",
    href: "/lead-generation",
    themeClass: "theme-lead",
    featured: true,
  },
  {
    icon: Building2,
    title: "Customer Success",
    description:
      "Replace repetitive how-to questions with an Agent that takes the action for users — updating settings, navigating your app, resolving requests in-product.",
    href: "/customer-success",
    themeClass: "theme-success",
  },
  {
    icon: Rocket,
    title: "SaaS Onboarding",
    description:
      "New users describe what they want to accomplish. Zephlo guides them through setup via conversation while tools configure everything in their browser session.",
    href: "/onboarding",
  },
  {
    icon: Headphones,
    title: "Workflow Automation",
    description:
      "Turn multi-step processes into simple conversations. Users say what they need, Zephlo executes the workflow — forms, navigation, data entry — all client-side.",
  },
  {
    icon: ShoppingCart,
    title: "In-App Training",
    description:
      "Guide users through features conversationally. Instead of docs they’ll never read, Zephlo walks them through your product by actually using it.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, delay: i * 0.1, ease: ease.out },
  }),
};

export default function UseCases() {
  return (
    <section id="use-cases" className="relative overflow-hidden py-24 sm:py-40">
      <div
        className="pointer-events-none absolute right-0 top-1/4 w-[600px] h-[600px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(18,117,202,0.04) 0%, rgba(96,165,250,0.02) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: ease.out }}
          className="text-center"
        >
          <span className="mb-5 inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            Use Cases
          </span>
          <h2 className="text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-[3.25rem]">
            One platform.
            <br />
            <span className="gradient-text">Endless possibilities.</span>
          </h2>
        </motion.div>

        <div className="mt-20 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map(
            ({ icon: Icon, title, description, href, featured, themeClass }, i) => (
              <motion.div
                key={title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className={`group relative flex flex-col rounded-2xl border p-7 transition-all duration-500 ${themeClass ?? ""} ${
                  featured
                    ? "border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] hover:border-[var(--page-accent)] md:col-span-2 lg:col-span-1"
                    : "border-[var(--subtle-white)] bg-[var(--card)] hover:border-[var(--page-accent-border)] hover:bg-[var(--card-hover)]"
                }`}
              >
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300"
                  style={{ background: "var(--page-accent-soft)" }}
                >
                  <Icon className="h-5 w-5 text-[var(--page-accent)]" />
                </div>
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                  {description}
                </p>
                {href && (
                  <div className="mt-6">
                    <a
                      href={href}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--page-accent)] transition-all duration-300 group-hover:gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--page-accent)]"
                    >
                      Learn more
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </motion.div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
