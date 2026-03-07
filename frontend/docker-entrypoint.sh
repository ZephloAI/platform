#!/bin/sh
# Generate runtime config from environment variables.
# This runs at container startup so the same image works with different config.

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  ASSISTANT_CHATBOT_ID: "${ASSISTANT_CHATBOT_ID:-}",
  ASSISTANT_API_KEY: "${ASSISTANT_API_KEY:-}"
};
EOF

exec nginx -g 'daemon off;'
