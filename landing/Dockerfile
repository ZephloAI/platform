# Stage 1 — build the Tailwind CSS
FROM node:22-alpine AS css
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY assets ./assets
COPY templates ./templates
COPY static ./static
RUN npx @tailwindcss/cli -i assets/site.css -o static/css/site.css --minify

# Stage 2 — build the Go binary (templates + static embedded)
FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod main.go ./
COPY templates ./templates
COPY --from=css /src/static ./static
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /landing .

# Stage 3 — scratch runtime, one static binary
FROM gcr.io/distroless/static-debian12
COPY --from=build /landing /landing
EXPOSE 3000
ENTRYPOINT ["/landing"]
