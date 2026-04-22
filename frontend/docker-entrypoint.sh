#!/bin/sh
# Generate runtime config from environment variables.
# This runs at container startup so the same image works with different config.

FLAPI_LINE=""
if [ "${APP_ENV:-}" = "development" ]; then
  FLAPI_LINE='window.FLAPI = "http://localhost";'
fi

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  ASSISTANT_CHATBOT_ID: "${ASSISTANT_CHATBOT_ID:-}",
  ASSISTANT_API_KEY: "${ASSISTANT_API_KEY:-}",
  WIDGET_API_URL: "${WIDGET_API_URL:-}"
};

${FLAPI_LINE}

EOF

exec nginx -g 'daemon off;'
