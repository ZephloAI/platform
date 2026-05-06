"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ease } from "@/lib/motion";
import { type FormEvent, useState, useRef, useEffect } from "react";
import { ArrowRight, Send, ChevronDown, Search } from "lucide-react";

const countryCodes = [
  { code: "+1", flag: "\u{1F1FA}\u{1F1F8}", name: "United States" },
  { code: "+44", flag: "\u{1F1EC}\u{1F1E7}", name: "United Kingdom" },
  { code: "+91", flag: "\u{1F1EE}\u{1F1F3}", name: "India" },
  { code: "+49", flag: "\u{1F1E9}\u{1F1EA}", name: "Germany" },
  { code: "+33", flag: "\u{1F1EB}\u{1F1F7}", name: "France" },
  { code: "+61", flag: "\u{1F1E6}\u{1F1FA}", name: "Australia" },
  { code: "+81", flag: "\u{1F1EF}\u{1F1F5}", name: "Japan" },
  { code: "+86", flag: "\u{1F1E8}\u{1F1F3}", name: "China" },
  { code: "+55", flag: "\u{1F1E7}\u{1F1F7}", name: "Brazil" },
  { code: "+27", flag: "\u{1F1FF}\u{1F1E6}", name: "South Africa" },
  { code: "+234", flag: "\u{1F1F3}\u{1F1EC}", name: "Nigeria" },
  { code: "+971", flag: "\u{1F1E6}\u{1F1EA}", name: "UAE" },
  { code: "+966", flag: "\u{1F1F8}\u{1F1E6}", name: "Saudi Arabia" },
  { code: "+65", flag: "\u{1F1F8}\u{1F1EC}", name: "Singapore" },
  { code: "+82", flag: "\u{1F1F0}\u{1F1F7}", name: "South Korea" },
  { code: "+31", flag: "\u{1F1F3}\u{1F1F1}", name: "Netherlands" },
  { code: "+46", flag: "\u{1F1F8}\u{1F1EA}", name: "Sweden" },
  { code: "+41", flag: "\u{1F1E8}\u{1F1ED}", name: "Switzerland" },
  { code: "+34", flag: "\u{1F1EA}\u{1F1F8}", name: "Spain" },
  { code: "+39", flag: "\u{1F1EE}\u{1F1F9}", name: "Italy" },
  { code: "+7", flag: "\u{1F1F7}\u{1F1FA}", name: "Russia" },
  { code: "+52", flag: "\u{1F1F2}\u{1F1FD}", name: "Mexico" },
  { code: "+47", flag: "\u{1F1F3}\u{1F1F4}", name: "Norway" },
  { code: "+48", flag: "\u{1F1F5}\u{1F1F1}", name: "Poland" },
  { code: "+351", flag: "\u{1F1F5}\u{1F1F9}", name: "Portugal" },
  { code: "+353", flag: "\u{1F1EE}\u{1F1EA}", name: "Ireland" },
  { code: "+64", flag: "\u{1F1F3}\u{1F1FF}", name: "New Zealand" },
  { code: "+63", flag: "\u{1F1F5}\u{1F1ED}", name: "Philippines" },
  { code: "+60", flag: "\u{1F1F2}\u{1F1FE}", name: "Malaysia" },
  { code: "+62", flag: "\u{1F1EE}\u{1F1E9}", name: "Indonesia" },
  { code: "+66", flag: "\u{1F1F9}\u{1F1ED}", name: "Thailand" },
  { code: "+84", flag: "\u{1F1FB}\u{1F1F3}", name: "Vietnam" },
  { code: "+20", flag: "\u{1F1EA}\u{1F1EC}", name: "Egypt" },
  { code: "+212", flag: "\u{1F1F2}\u{1F1E6}", name: "Morocco" },
  { code: "+233", flag: "\u{1F1EC}\u{1F1ED}", name: "Ghana" },
  { code: "+255", flag: "\u{1F1F9}\u{1F1FF}", name: "Tanzania" },
  { code: "+256", flag: "\u{1F1FA}\u{1F1EC}", name: "Uganda" },
  { code: "+251", flag: "\u{1F1EA}\u{1F1F9}", name: "Ethiopia" },
  { code: "+972", flag: "\u{1F1EE}\u{1F1F1}", name: "Israel" },
  { code: "+90", flag: "\u{1F1F9}\u{1F1F7}", name: "Turkey" },
  { code: "+380", flag: "\u{1F1FA}\u{1F1E6}", name: "Ukraine" },
  { code: "+56", flag: "\u{1F1E8}\u{1F1F1}", name: "Chile" },
  { code: "+57", flag: "\u{1F1E8}\u{1F1F4}", name: "Colombia" },
  { code: "+54", flag: "\u{1F1E6}\u{1F1F7}", name: "Argentina" },
  { code: "+51", flag: "\u{1F1F5}\u{1F1EA}", name: "Peru" },
  { code: "+92", flag: "\u{1F1F5}\u{1F1F0}", name: "Pakistan" },
  { code: "+880", flag: "\u{1F1E7}\u{1F1E9}", name: "Bangladesh" },
  { code: "+94", flag: "\u{1F1F1}\u{1F1F0}", name: "Sri Lanka" },
  { code: "+977", flag: "\u{1F1F3}\u{1F1F5}", name: "Nepal" },
];

function PhoneField({
  countryCode,
  phone,
  onCountryChange,
  onPhoneChange,
}: {
  countryCode: string;
  phone: string;
  onCountryChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = countryCodes.find((c) => c.code === countryCode) ?? countryCodes[0];
  const filtered = search
    ? countryCodes.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.includes(search)
      )
    : countryCodes;

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-[var(--foreground)]">
        Phone number
      </label>
      <div className="flex gap-0">
        {/* Country code selector */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => { setOpen(!open); setSearch(""); }}
            className="flex items-center gap-1.5 h-full rounded-l-xl border border-r-0 border-[var(--subtle-white-06)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)] transition-colors duration-300 hover:bg-[var(--subtle-white-03)]"
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="text-[12px] text-[var(--muted)] font-mono">{selected.code}</span>
            <ChevronDown className={`h-3 w-3 text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 z-50 mt-1 w-64 rounded-xl border border-[var(--subtle-white-06)] bg-[var(--card)] shadow-xl overflow-hidden"
                style={{ boxShadow: "0 20px 40px -12px var(--shadow-color)" }}
              >
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--subtle-white-04)]">
                  <Search className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] placeholder:opacity-50 outline-none"
                  />
                </div>

                {/* List */}
                <div className="max-h-56 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-3 py-4 text-[12px] text-[var(--muted)] text-center">No results</p>
                  ) : (
                    filtered.map((c) => (
                      <button
                        key={c.code + c.name}
                        type="button"
                        onClick={() => {
                          onCountryChange(c.code);
                          setOpen(false);
                          setSearch("");
                        }}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-[var(--subtle-white-03)] ${
                          c.code === countryCode ? "bg-[var(--accent)]/[0.06]" : ""
                        }`}
                      >
                        <span className="text-base leading-none">{c.flag}</span>
                        <span className="flex-1 text-[var(--foreground)] truncate">{c.name}</span>
                        <span className="text-[12px] text-[var(--muted)] font-mono">{c.code}</span>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Phone input */}
        <input
          type="tel"
          name="phone"
          zephlo-param-description="Local phone number digits (no country code)"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="712 345 678"
          className="w-full min-w-0 rounded-r-xl border border-[var(--subtle-white-06)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] placeholder:opacity-50 outline-none focus:border-[var(--accent)]/40 transition-colors duration-300"
        />
      </div>
    </div>
  );
}

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", countryCode: "+1", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const countryCodeInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("Contact form:", { ...form, fullPhone: `${form.countryCode}${form.phone}` });
    setSubmitted(true);
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // When the agent sets the hidden country_code input, sync it back to React state.
  useEffect(() => {
    const el = countryCodeInputRef.current;
    if (!el) return;
    const handler = () => {
      const next = el.value.startsWith("+") ? el.value : `+${el.value}`;
      const match = countryCodes.find((c) => c.code === next);
      if (match) update("countryCode", match.code);
    };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
    return () => {
      el.removeEventListener("input", handler);
      el.removeEventListener("change", handler);
    };
  }, []);

  return (
    <section id="contact" className="relative py-24 sm:py-40 px-6">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(18,117,202,0.08) 0%, rgba(96,165,250,0.04) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: ease.out }}
            className="flex flex-col gap-6"
          >
            <span className="inline-block text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
              Get in Touch
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
              Build an agent
              <br />
              <span className="gradient-text">tailored to your business.</span>
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-[var(--muted)] max-w-md">
              Every business has unique workflows. Our engineers work directly
              with your team to understand your processes, design the right tools,
              and deliver a fully personalized AI agent for your website.
            </p>

            <div className="flex flex-col gap-4 mt-4">
              <Benefit text="Agent customized to your exact workflows" />
              <Benefit text="Dedicated engineer to build your tools" />
              <Benefit text="Hands-on onboarding and integration support" />
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: ease.out }}
            className="rounded-2xl border border-[var(--subtle-white)] bg-[var(--card)] p-8 sm:p-10"
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center text-center gap-4 py-8"
              >
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center"
                  style={{ background: "var(--icon-bg)" }}
                >
                  <Send className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--foreground)]">
                  We&rsquo;ll be in touch!
                </h3>
                <p className="text-sm text-[var(--muted)] max-w-sm">
                  Thanks for reaching out. One of our engineers will review
                  your requirements and get back to you within 24 hours.
                </p>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5"
                zephlo-tool-name="contact_zephlo_team"
                zephlo-tool-description="Submit a contact request to the Zephlo team to build a custom AI agent. Collects the prospect's name, work email, company, phone number, and a description of their use case."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field
                    label="Name"
                    name="name"
                    type="text"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={(v) => update("name", v)}
                    paramDescription="Full name of the person reaching out"
                    required
                  />
                  <Field
                    label="Work email"
                    name="email"
                    type="email"
                    placeholder="jane@company.com"
                    value={form.email}
                    onChange={(v) => update("email", v)}
                    paramDescription="Work email address for follow-up"
                    required
                  />
                </div>
                <Field
                  label="Company"
                  name="company"
                  type="text"
                  placeholder="Company name"
                  value={form.company}
                  onChange={(v) => update("company", v)}
                  paramDescription="Name of the company or organization"
                  required
                />
                <PhoneField
                  countryCode={form.countryCode}
                  phone={form.phone}
                  onCountryChange={(code) => update("countryCode", code)}
                  onPhoneChange={(phone) => update("phone", phone)}
                />
                {/* Hidden mirror of the country dropdown so the agent can set it via the form scanner */}
                <input
                  ref={countryCodeInputRef}
                  type="hidden"
                  name="country_code"
                  value={form.countryCode}
                  zephlo-param-description="International dialing code with leading + (e.g. +1, +44, +254)"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[var(--foreground)]">
                    Tell us about your use case
                  </label>
                  <textarea
                    required
                    rows={4}
                    name="message"
                    zephlo-param-description="Describe the workflows to automate and the tools the users need"
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="What workflows would you like to automate? What tools do your users need?"
                    className="w-full rounded-xl border border-[var(--subtle-white-06)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] placeholder:opacity-50 outline-none focus:border-[var(--accent)]/40 transition-colors duration-300 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#1275CA] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0E5FA6] hover:shadow-[0_0_32px_-4px_rgba(18,117,202,0.5)] mt-1"
                >
                  Send Message
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>

                <p className="text-[11px] text-[var(--muted)] opacity-50 text-center">
                  We&rsquo;ll respond within 24 hours. No spam, ever.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  required,
  paramDescription,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  paramDescription?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-[var(--foreground)]">
        {label}
      </label>
      <input
        type={type}
        name={name}
        zephlo-param-description={paramDescription}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--subtle-white-06)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] placeholder:opacity-50 outline-none focus:border-[var(--accent)]/40 transition-colors duration-300"
      />
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "var(--icon-bg)" }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M2 5L4.5 7.5L8 3"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-sm text-[var(--muted)]">{text}</span>
    </div>
  );
}
