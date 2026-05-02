# Build context is the project root (set in docker-compose.yml)
# The widget is consumed via a turbopack alias in next.config.ts that points to
# ../widget/dist/zephlo.esm.js, so we build the widget first and place its
# output at /widget/dist/ for the alias to resolve during `next build`.

# Stage 1: Build the local widget
FROM node:20-alpine AS widget-build
WORKDIR /widget
COPY widget/package*.json ./
RUN npm install
COPY widget/ .
RUN npm run build

# Stage 2: Install landing dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY landing/package.json landing/package-lock.json* ./
RUN npm ci

# Stage 3: Build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=widget-build /widget /widget
COPY landing/ .

# NEXT_PUBLIC_* values are inlined into the JS bundle at build time, so they
# must be available as ENV before `next build` runs. Setting them on the pod
# at runtime would have no effect.
ARG NEXT_PUBLIC_ZEPHLO_API_KEY
ARG NEXT_PUBLIC_ZEPHLO_CHATBOT_ID
ARG NEXT_PUBLIC_ZEPHLO_API_URL
ARG NEXT_PUBLIC_DASHBOARD_URL
ARG NEXT_PUBLIC_DOCS_URL
ARG NEXT_PUBLIC_SALES_EMAIL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_ZEPHLO_API_KEY=$NEXT_PUBLIC_ZEPHLO_API_KEY \
    NEXT_PUBLIC_ZEPHLO_CHATBOT_ID=$NEXT_PUBLIC_ZEPHLO_CHATBOT_ID \
    NEXT_PUBLIC_ZEPHLO_API_URL=$NEXT_PUBLIC_ZEPHLO_API_URL \
    NEXT_PUBLIC_DASHBOARD_URL=$NEXT_PUBLIC_DASHBOARD_URL \
    NEXT_PUBLIC_DOCS_URL=$NEXT_PUBLIC_DOCS_URL \
    NEXT_PUBLIC_SALES_EMAIL=$NEXT_PUBLIC_SALES_EMAIL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npm run build

# Stage 4: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# `outputFileTracingRoot` in next.config.ts points one level above the project,
# so Next nests the project under `app/` inside the standalone output.
# Static/public must live at the same relative path; `node app/server.js` runs the bundled server.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./app/public

USER nextjs

EXPOSE 3000

CMD ["node", "app/server.js"]
