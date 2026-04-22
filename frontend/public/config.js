// Runtime config — overwritten by docker-entrypoint.sh in production.
// For local dev, edit the values below.
window.__APP_CONFIG__ = {
  ASSISTANT_CHATBOT_ID: "",
  ASSISTANT_API_KEY: "",
  // Where the chat widget (preview + assistant) should reach the API.
  // Leave empty to use the widget default (https://app.zephlo.ai).
  WIDGET_API_URL: ""
};
