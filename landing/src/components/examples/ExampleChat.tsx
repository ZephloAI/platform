"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, RefreshCw, Send, Sparkles, ExternalLink } from "lucide-react";
import type { Example, ScriptStep, FollowUp } from "./examplesData";

type RenderedMessage =
  | {
      id: number;
      role: "user";
      content: string;
    }
  | {
      id: number;
      role: "assistant";
      content: string;
      sources?: { title: string; url: string }[];
      followUps?: FollowUp[];
    };

/**
 * ExampleChat mirrors the visual language of the real <zephlo-chat> inline
 * element but plays a pre-scripted conversation locally so visitors can try
 * the example without a live Agent connection. Each call to `advance()`
 * renders the next script step; user clicks on follow-ups jump to the next
 * matching user step, then continue auto-playing assistant replies.
 */
export default function ExampleChat({ example }: { example: Example }) {
  const { script, title, suggestedPrompts } = example;

  const [cursor, setCursor] = useState(0);
  const [messages, setMessages] = useState<RenderedMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [nonce, setNonce] = useState(0);

  const idRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const nextId = useCallback(() => ++idRef.current, []);

  const reset = useCallback(() => {
    clearTimers();
    idRef.current = 0;
    setCursor(0);
    setMessages([]);
    setIsTyping(false);
    setStarted(false);
    setNonce((n) => n + 1);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Auto-scroll on new messages / typing indicator.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const pushMessage = useCallback(
    (msg: RenderedMessage) => setMessages((prev) => [...prev, msg]),
    [],
  );

  // Drive the script from `cursor`. Assistant steps render with a typing
  // delay; user steps render instantly. The player pauses when it reaches
  // a user step whose follow-ups need manual selection.
  useEffect(() => {
    if (!started) return;
    if (cursor >= script.length) return;

    const step = script[cursor];

    // Assistant steps: show typing, then render, then auto-advance.
    if (step.role === "assistant") {
      // Defer typing flag to a microtask so we don't setState directly in the
      // effect body (cascading-render lint rule).
      const t0 = setTimeout(() => setIsTyping(true), 0);
      timers.current.push(t0);
      const t1 = setTimeout(
        () => {
          setIsTyping(false);
          pushMessage({
            id: nextId(),
            role: "assistant",
            content: step.content,
            sources: step.sources,
            followUps: step.followUps,
          });
          // If followUps exist, pause and wait for user to pick one (or the
          // auto-advance below picks the scripted next user message).
          const nextStep = script[cursor + 1];
          if (step.followUps?.length && nextStep?.role === "user") {
            // Pause — wait for user click.
            return;
          }
          const t2 = setTimeout(() => setCursor((c) => c + 1), 400);
          timers.current.push(t2);
        },
        step.typingMs ?? 800,
      );
      timers.current.push(t1);
      return;
    }

    // Implicit user steps play automatically if we reach them without the
    // user having clicked a follow-up (e.g. at the very start, or after an
    // assistant step with no follow-ups).
    const t = setTimeout(() => {
      pushMessage({ id: nextId(), role: "user", content: step.content });
      setCursor((c) => c + 1);
    }, 500);
    timers.current.push(t);
  }, [cursor, started, script, pushMessage, nextId, nonce]);

  const handleStartPrompt = useCallback(
    (prompt: string) => {
      clearTimers();
      // Push the user's chosen opening prompt, then begin the scripted reply.
      pushMessage({ id: nextId(), role: "user", content: prompt });
      setStarted(true);
      // Skip past any scripted leading user message — jump to the first
      // assistant reply.
      const firstAssistantIdx = script.findIndex((s) => s.role === "assistant");
      setCursor(firstAssistantIdx >= 0 ? firstAssistantIdx : 0);
    },
    [clearTimers, nextId, pushMessage, script],
  );

  const handleFollowUp = useCallback(
    (fu: FollowUp) => {
      if (fu.href) {
        window.open(fu.href, "_blank", "noopener");
        return;
      }
      if (!fu.sendAs) return;

      clearTimers();
      // Remove follow-up buttons from the last assistant message — they're
      // consumed after the click (matches the real widget behavior).
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.role === "assistant" ? { ...m, followUps: undefined } : m,
        ),
      );
      pushMessage({ id: nextId(), role: "user", content: fu.sendAs });

      // Jump to the next scripted user step whose text matches, then let the
      // engine auto-play the assistant reply that follows it.
      const startIdx = Math.max(cursor, 0);
      const matchIdx = findNextUserStep(script, startIdx, fu.sendAs);
      if (matchIdx >= 0) {
        setCursor(matchIdx + 1);
      } else {
        // No scripted branch for this follow-up — fall back to a generic reply.
        const t = setTimeout(() => {
          setIsTyping(true);
          const t2 = setTimeout(() => {
            setIsTyping(false);
            pushMessage({
              id: nextId(),
              role: "assistant",
              content:
                "Good question — in a live Agent this is where your tool or knowledge base would kick in. Want to try another prompt?",
            });
          }, 900);
          timers.current.push(t2);
        }, 300);
        timers.current.push(t);
      }
    },
    [clearTimers, cursor, nextId, pushMessage, script],
  );

  const done = started && cursor >= script.length && !isTyping;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-[var(--subtle-white-06)] bg-[var(--card)]/90 backdrop-blur-2xl"
      style={{ boxShadow: "0 40px 80px -24px var(--shadow-color)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--subtle-white-06)] bg-[var(--card)] px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--icon-bg)]">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-[var(--foreground)]">
              {title}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--emerald)" }}
              />
              Live demo
            </div>
          </div>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-3 py-1.5 text-[11px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] hover:border-[var(--accent)]/30"
          aria-label="Restart demo"
        >
          <RefreshCw className="h-3 w-3" />
          Restart
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="relative h-[440px] overflow-y-auto px-5 py-6 space-y-5 sm:h-[500px]"
      >
        {!started && (
          <StartPanel
            suggestedPrompts={suggestedPrompts}
            onPick={handleStartPrompt}
          />
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} onFollowUp={handleFollowUp} />
          ))}
        </AnimatePresence>

        {isTyping && <TypingIndicator />}

        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2 text-center text-[11px] text-[var(--muted)]"
          >
            End of demo — press Restart to replay.
          </motion.div>
        )}
      </div>

      {/* Input (non-functional — scripted demo) */}
      <div className="border-t border-[var(--subtle-white-06)] bg-[var(--card)] p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-3">
          <span className="truncate text-[13px] text-[var(--muted)]">
            {started ? "Pick a suggestion above to continue…" : "Tap a suggested prompt to start"}
          </span>
          <button
            disabled
            aria-hidden="true"
            tabIndex={-1}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--subtle-white-06)] text-[var(--muted)] opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-[var(--muted)] opacity-60">
          Scripted preview — deploy your own Agent to try free-form chat
        </p>
      </div>
    </div>
  );
}

function StartPanel({
  suggestedPrompts,
  onPick,
}: {
  suggestedPrompts: string[];
  onPick: (prompt: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-full flex-col items-center justify-center gap-6 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--icon-bg)]">
        <Bot className="h-5 w-5 text-[var(--accent)]" />
      </div>
      <div className="space-y-1">
        <p className="text-[14px] font-semibold text-[var(--foreground)]">
          Try a prompt to see this Agent in action
        </p>
        <p className="text-[12px] text-[var(--muted)]">
          Click any suggestion below — the Agent replies and lets you branch.
        </p>
      </div>
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        {suggestedPrompts.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="group rounded-full border border-[var(--subtle-white-06)] bg-[var(--card)] px-4 py-2 text-[12px] text-[var(--foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
          >
            {p}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function MessageBubble({
  message,
  onFollowUp,
}: {
  message: RenderedMessage;
  onFollowUp: (fu: FollowUp) => void;
}) {
  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end"
      >
        <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-[#1275CA] px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(18,117,202,0.6)]">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-2"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)]">
          <Bot className="h-3.5 w-3.5 text-[var(--muted)]" />
        </div>
        <div className="max-w-[82%] space-y-3">
          <div
            className="rounded-2xl rounded-tl-sm border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-3 text-[13px] leading-relaxed text-[var(--foreground)] whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: formatInline(message.content) }}
          />
          {message.sources && message.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pl-0.5">
              {message.sources.map((s) => (
                <a
                  key={s.title + s.url}
                  href={s.url}
                  onClick={(e) => s.url === "#" && e.preventDefault()}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--subtle-white-06)] bg-[var(--card)] px-2.5 py-1 text-[10px] text-[var(--muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  {s.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {message.followUps && message.followUps.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-11">
          {message.followUps.map((fu) => (
            <button
              key={fu.label}
              onClick={() => onFollowUp(fu)}
              className="rounded-full border border-[var(--subtle-white-06)] bg-[var(--card)] px-3.5 py-1.5 text-[11.5px] text-[var(--foreground)] transition-all duration-200 hover:border-[var(--accent)]/50 hover:text-[var(--accent)] hover:-translate-y-0.5"
            >
              {fu.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)]">
        <Bot className="h-3.5 w-3.5 text-[var(--muted)]" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-[var(--subtle-white-06)] bg-[var(--subtle-white-03)] px-4 py-3">
        <Dot delay={0} />
        <Dot delay={0.15} />
        <Dot delay={0.3} />
      </div>
    </motion.div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="block h-1.5 w-1.5 rounded-full bg-[var(--muted)]"
      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
      transition={{ duration: 1, repeat: Infinity, delay }}
    />
  );
}

function findNextUserStep(
  script: readonly ScriptStep[],
  from: number,
  content: string,
): number {
  const normalizedTarget = content.trim().toLowerCase();
  for (let i = from; i < script.length; i++) {
    const step = script[i];
    if (step.role === "user" && step.content.trim().toLowerCase() === normalizedTarget) {
      return i;
    }
  }
  return -1;
}

// Tiny markdown subset: **bold** only. All other content is escaped so user-
// submitted text from script data stays safe even though it's authored by us.
function formatInline(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--accent)]">$1</strong>');
}

