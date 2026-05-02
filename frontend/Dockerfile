# Build context is the project root (set in docker-compose.yml)
# ENV=dev  → links local widget/ (no NPM_TOKEN needed)
# ENV=prod → installs zephlo from npm registry

# Stage 1: Build the local widget
FROM node:20-alpine AS widget-build
WORKDIR /widget
COPY widget/package*.json ./
RUN npm install
COPY widget/ .
RUN npm run build

# Stage 2: Build the frontend SPA
FROM node:20-alpine AS frontend-build
WORKDIR /app
ARG NPM_TOKEN
ARG ENV=prod
# Copy the built widget so we can link it in dev
COPY --from=widget-build /widget /widget

COPY frontend/package*.json ./

# Dev: strip zephlo from package.json, install deps, then link local widget
# Prod: use the npm token and install everything from the registry
RUN if [ "$ENV" = "dev" ]; then \
      sed -i '/"zephlo"/d' package.json && \
      npm install && \
      cd /widget && npm link && \
      cd /app && npm link zephlo; \
    else \
      npm config set //registry.npmjs.org/:_authToken=${NPM_TOKEN} && \
      npm install && \
      rm -f .npmrc; \
    fi

COPY frontend/ .
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_MICROSOFT_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_MICROSOFT_CLIENT_ID=$VITE_MICROSOFT_CLIENT_ID
RUN npm run build

# Stage 3: Serve with nginx
FROM nginx:alpine
ARG NGINX_CONF=nginx.conf
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY --from=widget-build /widget/dist /usr/share/nginx/html/widget
COPY frontend/${NGINX_CONF} /etc/nginx/conf.d/default.conf
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
