"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const navLinks = [
  { label: "Benefits", href: "#use-cases" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "Get in Touch", href: "#contact" },
];

export default function OnboardingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" as const }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[var(--background)]/70 backdrop-blur-2xl border-b border-[var(--subtle-white)]"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo — links to self, not to general landing */}
        <a href="/onboarding" className="flex items-center gap-2.5 group">
          <div className="relative h-7 w-7 rounded-lg bg-gradient-to-br from-[#1275CA] to-[#60A5FA] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <div className="h-2.5 w-2.5 rounded-sm bg-white/90" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#1275CA] to-[#60A5FA] opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-300" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            zephlo
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-[13px] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground)]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggle}
            className="relative h-9 w-9 rounded-full border border-[var(--subtle-white)] bg-[var(--subtle-white-03)] flex items-center justify-center text-[var(--muted)] transition-all duration-300 hover:text-[var(--foreground)] hover:border-[var(--subtle-white-hover)]"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <a
            href="#contact"
            className="inline-flex items-center rounded-full px-5 py-2 text-[13px] font-medium text-white bg-[#1275CA] transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_24px_-4px_rgba(18,117,202,0.5)]"
          >
            Request a Demo
          </a>
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggle}
            className="relative h-9 w-9 rounded-full border border-[var(--subtle-white)] bg-[var(--subtle-white-03)] flex items-center justify-center text-[var(--muted)] transition-all duration-300 hover:text-[var(--foreground)]"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative z-50 p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" as const }}
            className="md:hidden overflow-hidden border-b border-[var(--subtle-white)] bg-[var(--background)]/95 backdrop-blur-2xl"
          >
            <div className="flex flex-col gap-1 px-6 pb-6 pt-2">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ x: -12, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--subtle-white-03)] hover:text-[var(--foreground)]"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: navLinks.length * 0.05, duration: 0.25 }}
                className="mt-2 flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium text-white bg-[#1275CA]"
              >
                Request a Demo
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
