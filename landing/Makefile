# Zephlo landing (Go). `make css` needs Node only at build time — the runtime
# is a single Go binary with everything embedded.

.PHONY: css dev build run docker export deploy

css: node_modules
	npx @tailwindcss/cli -i assets/site.css -o static/css/site.css --minify

node_modules: package.json
	npm install

dev: css
	go run . -dev

build: css
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/landing .

run: build
	./bin/landing

docker:
	docker build -t zephlo-landing .

# ── Cloudflare Pages ────────────────────────────────────────────────────────
# The same templates, rendered to flat files. `functions/` handles the two
# lead form POSTs, since a static host can't run the Go handlers.

export: css
	go run . -export dist
	# Without this, Pages sends EVERY request through the Functions Worker.
	# The two form POSTs are all it should handle; pages stay pure static.
	cp cloudflare/_routes.json dist/_routes.json

# Preview the built site with the Functions running, exactly as deployed.
preview: export
	npx wrangler pages dev dist --port 8788

deploy: export
	npx wrangler pages deploy dist --project-name=zephlo-landing --branch main
