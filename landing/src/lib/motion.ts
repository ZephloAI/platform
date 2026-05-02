import { useEffect, useState } from "react";
import type { Variants, Transition } from "framer-motion";

/**
 * Motion tokens — the house language.
 * Apple/Linear school: exponential deceleration, no bounce, one thing at a time.
 */
export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  outSoft: [0.25, 1, 0.5, 1] as const,
  outSnap: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
} as const;

export const duration = {
  feedback: 0.18,
  state: 0.32,
  reveal: 0.6,
  signature: 0.85,
} as const;

export const stagger = {
  tight: 0.05,
  default: 0.08,
  roomy: 0.12,
} as const;

/**
 * Baseline reveal — fade + rise. Used across every section.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.reveal, ease: ease.out },
  },
};

export const fadeUpBlur: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: duration.signature, ease: ease.out },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: duration.reveal, ease: ease.out },
  },
};

export const staggerParent = (gap: number = stagger.default): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: gap, delayChildren: 0.05 },
  },
});

/**
 * Props you can spread onto a motion component to run the reveal on scroll.
 * Matches the house pattern: once, generous margin, ease-out-expo.
 */
export const inViewReveal = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-80px" },
} as const;

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
  mass: 0.9,
};

/**
 * True on viewports where scroll-driven parallax reads as polished.
 * Returns false on phones (< md breakpoint) where transform-on-scroll
 * causes jank on low-end GPUs and drains battery.
 * Starts as false so SSR renders the mobile-safe (static) path.
 */
export function useParallaxEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    const update = () => setEnabled(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return enabled;
}