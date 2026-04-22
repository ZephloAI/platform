// ============================================================
// Runtime app config — populated at container start by
// docker-entrypoint.sh writing to /config.js.
// See frontend/public/config.js for the local-dev shape.
// ============================================================

export interface AppConfig {
  ASSISTANT_CHATBOT_ID?: string;
  ASSISTANT_API_KEY?: string;
  /**
   * Origin where the chat widget (preview + dashboard assistant) reaches the
   * API, e.g. "http://localhost" or "https://app.zephlo.ai". Leave empty to
   * use the widget's built-in default (https://app.zephlo.ai).
   */
  WIDGET_API_URL?: string;
}

export function getAppConfig(): AppConfig {
  return (window as any).__APP_CONFIG__ || {};
}

/**
 * Resolve the API URL for the chat widget. Returns undefined when no
 * override is configured so callers can let the widget use its default.
 */
export function getWidgetApiUrl(): string | undefined {
  const url = getAppConfig().WIDGET_API_URL?.trim();
  return url ? url : undefined;
}
