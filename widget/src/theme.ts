/**
 * Theme system for the widget.
 *
 * Two color sets (light, dark) and a mode that selects which one is active.
 * Colors map onto the CSS variables defined in styles.ts; views apply them
 * by setting properties on their shadow host element so updates take effect
 * without a re-render.
 */

/** User-customizable colors. All other CSS vars are derived per-mode. */
export interface ThemeColors {
  headerColor?: string;
  userBubbleColor?: string;
  assistantBubbleColor?: string;
  textColor?: string;
  bgColor?: string;
}

export type ThemeMode = "auto" | "light" | "dark";

export interface ThemeOptions {
  mode?: ThemeMode;
  light?: ThemeColors;
  dark?: ThemeColors;
}

/** Fully resolved color set written to the shadow host as CSS vars. */
export interface ResolvedColors {
  headerColor: string;
  userBubbleColor: string;
  assistantBubbleColor: string;
  textColor: string;
  textSecondary: string;
  textTertiary: string;
  bgColor: string;
  bgSecondary: string;
  bgTertiary: string;
  border: string;
}

const LIGHT_DEFAULTS: ResolvedColors = {
  headerColor: "#0071e3",
  userBubbleColor: "#0071e3",
  assistantBubbleColor: "#f5f5f7",
  textColor: "#1d1d1f",
  textSecondary: "#6e6e73",
  textTertiary: "#86868b",
  bgColor: "#ffffff",
  bgSecondary: "#f5f5f7",
  bgTertiary: "#e8e8ed",
  border: "rgba(0, 0, 0, 0.06)",
};

const DARK_DEFAULTS: ResolvedColors = {
  headerColor: "#0a84ff",
  userBubbleColor: "#0a84ff",
  assistantBubbleColor: "#2c2c2e",
  textColor: "#f5f5f7",
  textSecondary: "rgba(235, 235, 240, 0.6)",
  textTertiary: "rgba(235, 235, 240, 0.3)",
  bgColor: "#1c1c1e",
  bgSecondary: "#2c2c2e",
  bgTertiary: "#3a3a3c",
  border: "rgba(255, 255, 255, 0.1)",
};

/** CSS variable mapping. Used by views to apply resolved colors to the host. */
export const COLOR_TO_CSS_VAR: Record<keyof ResolvedColors, string> = {
  headerColor: "--cb-accent",
  userBubbleColor: "--cb-user-bubble",
  assistantBubbleColor: "--cb-assistant-bubble",
  textColor: "--cb-text",
  textSecondary: "--cb-text-secondary",
  textTertiary: "--cb-text-tertiary",
  bgColor: "--cb-bg",
  bgSecondary: "--cb-bg-secondary",
  bgTertiary: "--cb-bg-tertiary",
  border: "--cb-border",
};

/**
 * Resolve the colors that should be applied right now, given:
 *   - The active mode (light or dark)
 *   - User-provided overrides for that mode (from initialize() or setters)
 */
export function resolveColors(
  mode: "light" | "dark",
  overrides: ThemeColors | undefined,
): ResolvedColors {
  const base = mode === "dark" ? DARK_DEFAULTS : LIGHT_DEFAULTS;
  const pick = <K extends keyof ThemeColors>(key: K): string =>
    overrides?.[key] ?? (base as any)[key];

  return {
    headerColor: pick("headerColor"),
    userBubbleColor: pick("userBubbleColor"),
    assistantBubbleColor: pick("assistantBubbleColor"),
    textColor: pick("textColor"),
    bgColor: pick("bgColor"),
    textSecondary: base.textSecondary,
    textTertiary: base.textTertiary,
    bgSecondary: base.bgSecondary,
    bgTertiary: base.bgTertiary,
    border: base.border,
  };
}

/**
 * Detect the host page's current theme by checking standard signals in
 * order of reliability. Falls back to OS preference if the page hasn't
 * declared one.
 */
export function detectHostTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const html = document.documentElement;

  // 1. Explicit data-theme attribute (Tailwind, daisyUI, many design systems)
  const dataTheme = html.dataset.theme || document.body?.dataset.theme;
  if (dataTheme === "dark") return "dark";
  if (dataTheme === "light") return "light";

  // 2. Tailwind-style `.dark` / `.light` class on <html>
  if (html.classList.contains("dark")) return "dark";
  if (html.classList.contains("light")) return "light";

  // 3. CSS `color-scheme` property — the spec-recommended way for a page
  //    to declare which schemes it supports.
  if (typeof window !== "undefined") {
    const scheme = window.getComputedStyle(html).colorScheme;
    if (scheme === "dark" || scheme === "only dark") return "dark";
    if (scheme === "light" || scheme === "only light") return "light";
  }

  // 4. Fall back to the user's OS preference.
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return "light";
}

/** Resolve `mode: 'auto'` to a concrete light/dark using the host page's signals. */
export function resolveActiveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  return detectHostTheme();
}
