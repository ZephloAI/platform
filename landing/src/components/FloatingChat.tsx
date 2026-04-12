"use client";

import { MessageCircle } from "lucide-react";

export default function FloatingChat() {
  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <button
        aria-label="Open chat"
        className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-[#1275CA] text-white shadow-[0_20px_50px_-10px_rgba(18,117,202,0.6)] transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <MessageCircle className="h-7 w-7 fill-white/10" strokeWidth={2} />
        <span className="absolute -right-0 -top-0 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1275CA]/70 opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-[var(--background)] bg-[#1275CA]" />
        </span>
      </button>
    </div>
  );
}
