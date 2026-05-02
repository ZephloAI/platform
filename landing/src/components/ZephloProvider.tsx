"use client";

import { useEffect } from "react";

/**
 * Initializes the Zephlo widget SDK once for the whole page.
 * Render this high in the tree; `<zephlo-fab>` and `<zephlo-chat>`
 * elements anywhere below will light up once initialization resolves.
 *
 * Config comes from build-time env:
 *   NEXT_PUBLIC_ZEPHLO_API_KEY      — public widget key
 *   NEXT_PUBLIC_ZEPHLO_CHATBOT_ID   — agent UUID (never the numeric id)
 *   NEXT_PUBLIC_ZEPHLO_API_URL      — optional API host override
 *
 * If key or chatbotId is missing, we log a warning and no-op so the
 * page still renders cleanly in environments without credentials.
 */
export default function ZephloProvider() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_ZEPHLO_API_KEY;
    const chatbotId = process.env.NEXT_PUBLIC_ZEPHLO_CHATBOT_ID;
    const apiUrl = process.env.NEXT_PUBLIC_ZEPHLO_API_URL;
    if (!key || !chatbotId) {
      console.warn(
        "[Zephlo] NEXT_PUBLIC_ZEPHLO_API_KEY / NEXT_PUBLIC_ZEPHLO_CHATBOT_ID missing — live widget disabled.",
      );
      return;
    }

    let cancelled = false;
    let destroy: (() => void) | null = null;

    (async () => {
      // Dynamic import — the widget touches `window` at module top level,
      // so it cannot run during SSR.
      const { default: Zephlo } = await import("zephlo");
      if (cancelled) return;

      const instance = Zephlo.initialize({
        key,
        chatbotId,
        ...(apiUrl ? { apiUrl } : {}),
        theme: { mode: "auto" },
      });
      destroy = () => instance.destroy();
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  return null;
}
