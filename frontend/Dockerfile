# Build context is the project root (set in docker-compose.yml)

# Stage 1: Build the frontend SPA
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build the embeddable widget
FROM node:20-alpine AS widget-build
WORKDIR /widget
COPY widget/package*.json ./
RUN npm install
COPY widget/ .
RUN npm run build

# Stage 3: Serve with nginx
FROM nginx:alpine
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY --from=widget-build /widget/dist /usr/share/nginx/widget
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
