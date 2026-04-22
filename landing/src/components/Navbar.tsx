"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, ChevronDown, Zap, Globe, Shield, Settings, Headphones, Rocket, ShoppingCart, GraduationCap } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { links } from "@/lib/links";

const productLinks = [
  { label: "Platform overview", href: "/platform", icon: Zap, description: "How Zephlo works end-to-end" },
  { label: "Features", href: "/#features", icon: Globe, description: "Crawl, embed, chat, act" },
  { label: "How it works", href: "/#how-it-works", icon: Settings, description: "From URL to live Agent" },
  { label: "Security", href: "/platform#security", icon: Shield, description: "Built for production" },
];

const useCaseLinks = [
  { label: "SaaS Onboarding", href: "/onboarding", icon: Rocket, description: "Turn setup into a conversation" },
  { label: "Customer Support", href: "/#use-cases", icon: Headphones, description: "Resolve issues directly in-app" },
  { label: "Workflow Automation", href: "/#use-cases", icon: ShoppingCart, description: "Automate multi-step processes" },
  { label: "In-App Training", href: "/#use-cases", icon: GraduationCap, description: "Guide users through features" },
];

function DropdownMenu({ items, open }: { items: typeof productLinks; open: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" as const }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-xl border border-[var(--subtle-white-06)] bg-[var(--card)] shadow-2xl overflow-hidden"
          style={{ boxShadow: "0 20px 50px -12px var(--shadow-color)" }}
        >
          <div className="p-2">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200 hover:bg-[var(--subtle-white-03)]"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--icon-bg)" }}>
                    <Icon className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--foreground)]">{item.label}</p>
                    <p className="text-[11px] text-[var(--muted)] leading-snug">{item.description}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavDropdown({ label, items }: { label: string; items: typeof productLinks }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <div ref={ref} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button className="flex items-center gap-1 text-[13px] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground)]">
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <DropdownMenu items={items} open={open} />
    </div>
  );
}

export default function Navbar() {
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
        {/* Logo */}
        <Link href="/" aria-label="Zephlo home" className="flex items-center gap-2.5 group">
          <div className="relative h-7 w-7 rounded-lg bg-gradient-to-br from-[#1275CA] to-[#60A5FA] flex items-center justify-center transition-transform duration-300 group-hover:scale-105" aria-hidden="true">
            <div className="h-2.5 w-2.5 rounded-sm bg-white/90" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#1275CA] to-[#60A5FA] opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-300" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            zephlo
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          <NavDropdown label="Product" items={productLinks} />
          <NavDropdown label="Solutions" items={useCaseLinks} />
          <a href="/examples" className="text-[13px] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground)]">Examples</a>
          <a href="/customers" className="text-[13px] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground)]">Customers</a>
          <a href="/pricing" className="text-[13px] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground)]">Pricing</a>
        </div>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggle}
            className="relative h-9 w-9 rounded-full border border-[var(--subtle-white)] bg-[var(--subtle-white-03)] flex items-center justify-center text-[var(--muted)] transition-all duration-300 hover:text-[var(--foreground)] hover:border-[var(--subtle-white-hover)]"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
                  <Sun className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: -90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
                  <Moon className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <a href={links.signIn} className="text-[13px] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground)]">
            Sign in
          </a>
          <a
            href={links.signUp}
            className="inline-flex items-center rounded-full px-5 py-2 text-[13px] font-medium text-white bg-[#1275CA] transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_24px_-4px_rgba(18,117,202,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Start free
          </a>
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggle}
            className="relative h-9 w-9 rounded-full border border-[var(--subtle-white)] bg-[var(--subtle-white-03)] flex items-center justify-center text-[var(--muted)]"
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
              <p className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] opacity-50">Product</p>
              {productLinks.map((link, i) => (
                <motion.a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04, duration: 0.25 }} className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--subtle-white-03)] hover:text-[var(--foreground)]">{link.label}</motion.a>
              ))}
              <p className="px-3 pt-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] opacity-50">Solutions</p>
              {useCaseLinks.map((link, i) => (
                <motion.a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: (productLinks.length + i) * 0.04, duration: 0.25 }} className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--subtle-white-03)] hover:text-[var(--foreground)]">{link.label}</motion.a>
              ))}
              <div className="divider my-2 border-t border-[var(--subtle-white-04)]" />
              <motion.a href="/examples" onClick={() => setMobileOpen(false)} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.33, duration: 0.25 }} className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--subtle-white-03)] hover:text-[var(--foreground)]">Examples</motion.a>
              <motion.a href="/customers" onClick={() => setMobileOpen(false)} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.35, duration: 0.25 }} className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--subtle-white-03)] hover:text-[var(--foreground)]">Customers</motion.a>
              <motion.a href="/pricing" onClick={() => setMobileOpen(false)} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.25 }} className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--subtle-white-03)] hover:text-[var(--foreground)]">Pricing</motion.a>
              <motion.a
                href={links.signIn}
                onClick={() => setMobileOpen(false)}
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.42, duration: 0.25 }}
                className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--subtle-white-03)] hover:text-[var(--foreground)]"
              >
                Sign in
              </motion.a>
              <motion.a
                href={links.signUp}
                onClick={() => setMobileOpen(false)}
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.25 }}
                className="mt-2 flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium text-white bg-[#1275CA]"
              >
                Start free
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
