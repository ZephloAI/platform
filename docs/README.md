# Zephlo Agent Platform — Docs

The Zephlo platform turns any website into a conversational Agent: crawl
your site, drop in a widget, and your visitors chat with an Agent that's
grounded in your content and can take actions on the page.

## Where to start

| If you want to… | Read |
|---|---|
| Stand up your first Agent end-to-end | [Getting Started](./getting-started.md) |
| Embed the widget, register browser-side tools, use the WebSocket protocol | [Widget Developer Guide](./widget.md) |
| Manage Agents from your own backend | [API Reference](./api-reference.md) |
| Debug something that's broken | [Troubleshooting & FAQ](./troubleshooting.md) |

## Key concepts in 30 seconds

- An **Agent** is one assistant — one knowledge base, one personality, one
  widget. Identified by its UUID (`public_id`).
- An **Organization** owns Agents, members, and API keys. A user can
  belong to multiple organizations.
- **API keys** (`flk_…`) authenticate public clients (widgets, mobile
  apps) to one Agent or organization. JWT Bearer tokens authenticate
  *users* to the dashboard API.
- **The widget** is an embeddable custom element (`<zephlo-fab>` floating
  button, `<zephlo-chat>` inline panel). It talks to the platform over a
  single WebSocket per session.
- **Browser tools** let the Agent act on the page — registered via
  `Zephlo.initialize().registerTool(...)` or auto-discovered from
  `<form zephlo-tool-name="…">` elements.

## Deploying these docs

These files are plain Markdown. They render as-is on GitHub, and any
static-site generator (MkDocs, Docusaurus, Nextra, VitePress) can consume
them without moving files around. A few easy options:

- **GitHub Pages from `/docs`** — in repo Settings → Pages, pick the
  branch and set the folder to `/docs`. No build step needed.
- **MkDocs** — add an `mkdocs.yml` at the repo root pointing `docs_dir:
  docs` and list the four pages under `nav:`. `mkdocs build` produces a
  `site/` ready to deploy.
- **Link from the landing site + dashboard** — both should point at the
  published URL of `docs/getting-started.md` once it's live.

When you publish, keep the URL stable (e.g. `https://docs.zephlo.ai`) so
in-product links don't rot.

## Contributing

The source of truth for every endpoint is `api/app/routers/*.py` and the
matching Pydantic schemas; for the widget it's `widget/src/`. When code
changes, update the relevant doc page in the same PR. Run a quick pass of
the markdown through any renderer before merging to catch broken links.
