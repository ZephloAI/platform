"use client";

import { MessageCircle } from "lucide-react";
import { links } from "@/lib/links";

export default function FloatingChat() {
  return (
    <div className="fixed bottom-6 right-6 z-[100] sm:bottom-8 sm:right-8">
      <a
        href={links.sales}
        aria-label="Talk to sales"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1275CA] text-white shadow-[0_20px_50px_-10px_rgba(18,117,202,0.6)] transition-all duration-300 hover:scale-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:h-16 sm:w-16"
      >
        <MessageCircle className="h-6 w-6 fill-white/10 sm:h-7 sm:w-7" strokeWidth={2} aria-hidden="true" />
        <span className="absolute -right-0 -top-0 flex h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1275CA]/70 opacity-75" />
          <span className="relative inline-flex h-full w-full rounded-full border-2 border-[var(--background)] bg-[#1275CA]" />
        </span>
      </a>
    </div>
  );
}
