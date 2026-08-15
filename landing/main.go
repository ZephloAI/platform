// Zephlo marketing site — a single Go binary serving server-rendered pages.
//
// Stack: net/http + html/template + htmx (forms) + Tailwind (built at compile
// time into static/css/site.css). Templates and static assets are embedded,
// so the production artifact is one self-contained binary.
//
// Run locally:
//
//	make css        # build static/css/site.css (needed once, and after template edits)
//	go run . -dev   # -dev reloads templates from disk on every request
package main

import (
	"bytes"
	"embed"
	"encoding/xml"
	"flag"
	"fmt"
	"html/template"
	"io/fs"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"time"
)

//go:embed all:templates all:static
var embedded embed.FS

// links holds the outbound product URLs used by CTAs across the site.
// Resolved from env at startup so the same image can point at staging or
// production without code changes.
type links struct {
	SignUp     string
	SignIn     string
	Docs       string
	Sales      string
	SalesEmail string
	// ExamplesOrg is the GitHub org hosting every example's repository.
	ExamplesOrg string
}

// widgetConfig configures the live Zephlo Agent embedded on the site itself.
// If ChatbotID is empty the embed is skipped and the page still renders.
type widgetConfig struct {
	ScriptSrc string
	ChatbotID string
	APIURL    string
}

// legalUpdated is shown on the privacy and terms pages. Bump it whenever
// either page changes in a way that matters to a reader.
const legalUpdated = "15 August 2026"

type site struct {
	URL    string
	Links  links
	Widget widgetConfig
	// LegalUpdated dates the privacy policy and terms of service.
	LegalUpdated string
	// AssetVer is appended to static asset URLs (?v=...) so browsers drop
	// their cached CSS/JS whenever a new binary is deployed.
	AssetVer string
	dev      bool
	tmpl     map[string]*template.Template
}

// pageData is what every template receives.
type pageData struct {
	Title       string
	Description string
	Path        string // current request path, for nav active state
	MainClass   string // per-page accent theme, e.g. "theme-success"
	Sent        bool   // no-JS fallback: form was submitted, show success state
	Example     *example
	Site        *site
	Year        int
}

// example is one live demo, shown in the /examples gallery and embedded on its
// own /examples/<slug> page. Each example is a standalone repository with its
// own deploy, so both URLs are absolute.
type example struct {
	Slug    string
	Title   string
	Tagline string
	Demo    string // where the demo is deployed, embedded and linked from
	Source  string // the example's own GitHub repository
}

var exampleList = []example{
	{
		Slug:    "conversational-form",
		Title:   "Conversational Form",
		Tagline: "The Agent interviews the visitor and fills a multi-step application for them — no typing into fields, no drop-off.",
		Demo:    "https://zephlo-form-demo.pages.dev",
		Source:  "https://github.com/ZephloAI/form-example",
	},
	{
		Slug:    "chat-with-your-data",
		Title:   "Chat with your Data",
		Tagline: "Ask questions in plain English. The Agent queries a live dataset with tools and updates the charts and table in front of you.",
		Demo:    "https://zephlo-data-demo.pages.dev",
		Source:  "https://github.com/ZephloAI/chat-with-data-example",
	},
	{
		Slug:    "project-management-copilot",
		Title:   "Project Management Copilot",
		Tagline: "Create, move, assign, and prioritise tasks on a kanban board by asking — the Agent runs the workflow client-side.",
		Demo:    "https://zephlo-projects-demo.pages.dev",
		Source:  "https://github.com/ZephloAI/projects-management-example",
	},
}

func env(key, fallback string) string {
	if v := strings.TrimRight(os.Getenv(key), "/"); v != "" {
		return v
	}
	return fallback
}

func newSite(dev bool) (*site, error) {
	dashboard := env("DASHBOARD_URL", "https://app.zephlo.ai")
	salesEmail := env("SALES_EMAIL", "sales@zephlo.ai")

	s := &site{
		AssetVer:     time.Now().Format("20060102150405"),
		URL:          env("SITE_URL", "https://zephlo.ai"),
		LegalUpdated: legalUpdated,
		Links: links{
			SignUp:      dashboard + "/register",
			SignIn:      dashboard + "/login",
			Docs:        env("DOCS_URL", "https://docs.zephlo.ai"),
			Sales:       "mailto:" + salesEmail + "?subject=Talk%20to%20sales%20about%20Zephlo",
			SalesEmail:  salesEmail,
			ExamplesOrg: env("EXAMPLES_ORG_URL", "https://github.com/ZephloAI"),
		},
		Widget: widgetConfig{
			ScriptSrc: env("ZEPHLO_WIDGET_SRC", "https://unpkg.com/zephlo"),
			ChatbotID: os.Getenv("ZEPHLO_CHATBOT_ID"),
			APIURL:    env("ZEPHLO_API_URL", "https://app.zephlo.ai"),
		},
		dev: dev,
	}
	if err := s.loadTemplates(); err != nil {
		return nil, err
	}
	return s, nil
}

// loadTemplates parses each page together with the base layout and partials.
// Pages live in templates/pages/, shared pieces in templates/partials/.
func (s *site) loadTemplates() error {
	root := s.templateFS()
	pages, err := fs.Glob(root, "templates/pages/*.html")
	if err != nil {
		return err
	}
	s.tmpl = make(map[string]*template.Template, len(pages))
	for _, page := range pages {
		name := strings.TrimSuffix(strings.TrimPrefix(page, "templates/pages/"), ".html")
		t, err := template.ParseFS(root, "templates/base.html", "templates/partials/*.html", page)
		if err != nil {
			return fmt.Errorf("parsing %s: %w", page, err)
		}
		s.tmpl[name] = t
	}
	return nil
}

func (s *site) templateFS() fs.FS {
	if s.dev {
		return os.DirFS(".")
	}
	return embedded
}

func (s *site) render(w http.ResponseWriter, r *http.Request, page string, data pageData) {
	if s.dev {
		// Re-parse on every request so template edits show up on refresh.
		if err := s.loadTemplates(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	data.Path = r.URL.Path
	data.Site = s
	data.Year = time.Now().Year()
	data.Sent = r.URL.Query().Get("sent") == "1"

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := s.tmpl[page].ExecuteTemplate(w, "base.html", data); err != nil {
		slog.Error("render failed", "page", page, "err", err)
	}
}

// renderPartial renders a single named partial (htmx form responses).
func (s *site) renderPartial(w http.ResponseWriter, name string) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	t := s.tmpl["home"] // every page set includes all partials
	if err := t.ExecuteTemplate(w, name, nil); err != nil {
		slog.Error("render partial failed", "partial", name, "err", err)
	}
}

// ── Handlers ────────────────────────────────────────────────────────────────

func (s *site) home(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		s.notFound(w, r)
		return
	}
	s.render(w, r, "home", pageData{
		Title:       "Zephlo — The AI Agent that does the work for your users",
		Description: "Zephlo gives your website an AI Agent that fills in forms, queries data, and completes tasks for your visitors — real actions on the page, from a single script tag.",
	})
}

func (s *site) security(w http.ResponseWriter, r *http.Request) {
	s.render(w, r, "security", pageData{
		Title:       "Security — Zephlo",
		Description: "Conversations stored safely and encrypted. Role-based access control. SOC 2, GDPR, and HIPAA compliance work underway.",
		MainClass:   "theme-secure",
	})
}

func (s *site) customerSuccess(w http.ResponseWriter, r *http.Request) {
	s.render(w, r, "customer-success", pageData{
		Title:       "Customer Success — Zephlo",
		Description: "No more dedicated agents answering “how do I do X?” or “where is X?”. Zephlo Agents use client-side tools to take action for users — instantly, in-product.",
		MainClass:   "theme-success",
	})
}

func (s *site) examples(w http.ResponseWriter, r *http.Request) {
	s.render(w, r, "examples", pageData{
		Title:       "Examples — Zephlo",
		Description: "Live, one-page examples of what a Zephlo Agent can do: fill forms, query your data, and run your workflows — all client-side, from a single script tag.",
	})
}

// thanks is where a no-JS lead submission lands. On the static build the
// ?sent=1 fallback can't work (the HTML is pre-rendered), so the Pages
// Function redirects here instead.
func (s *site) thanks(w http.ResponseWriter, r *http.Request) {
	s.render(w, r, "thanks", pageData{
		Title:       "Thanks — Zephlo",
		Description: "Your message reached us. Expect a reply within one business day.",
	})
}

func (s *site) privacy(w http.ResponseWriter, r *http.Request) {
	s.render(w, r, "privacy", pageData{
		Title:       "Privacy Policy — Zephlo",
		Description: "How Zephlo handles personal data: what we store from Agent conversations, who processes it, how long we keep it, and the rights you have over it.",
	})
}

func (s *site) terms(w http.ResponseWriter, r *http.Request) {
	s.render(w, r, "terms", pageData{
		Title:       "Terms of Service — Zephlo",
		Description: "The terms governing use of Zephlo, including your responsibilities for the tools an Agent runs and the limits of reliance on AI-generated output.",
	})
}

// notFound is exported as 404.html so a static host answers unknown URLs with
// a real 404 instead of falling back to the home page.
func (s *site) notFound(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	s.render(w, r, "notfound", pageData{
		Title:       "Page not found — Zephlo",
		Description: "The page you were looking for could not be found.",
	})
}

func (s *site) exampleDetail(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	for i := range exampleList {
		if exampleList[i].Slug == slug {
			s.render(w, r, "example-detail", pageData{
				Title:       exampleList[i].Title + " — Zephlo Examples",
				Description: exampleList[i].Tagline,
				Example:     &exampleList[i],
			})
			return
		}
	}
	s.notFound(w, r)
}

func (s *site) onboarding(w http.ResponseWriter, r *http.Request) {
	s.render(w, r, "onboarding", pageData{
		Title:       "Onboarding — Zephlo",
		Description: "Conversational onboarding that configures your product directly in users' browsers. No APIs, no OAuth, no credential storage. Activation in the first session.",
	})
}

func (s *site) leadGeneration(w http.ResponseWriter, r *http.Request) {
	s.render(w, r, "lead-generation", pageData{
		Title:       "Lead Generation — Zephlo",
		Description: "Capture every lead with timely, 24/7 responses. Zephlo Agents reply in seconds, qualify visitors, and book meetings — even after working hours.",
		MainClass:   "theme-lead",
	})
}

// lead handles both lead forms. htmx requests get the success partial swapped
// in place; plain form posts (JS disabled) redirect back with ?sent=1.
func (s *site) lead(successPartial, fallbackAnchor string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			http.Error(w, "bad form", http.StatusBadRequest)
			return
		}
		if r.FormValue("name") == "" || !strings.Contains(r.FormValue("email"), "@") {
			http.Error(w, "name and a valid email are required", http.StatusUnprocessableEntity)
			return
		}
		// No CRM integration yet — log the lead so it lands in container logs.
		slog.Info("lead received",
			"form", successPartial,
			"name", r.FormValue("name"),
			"email", r.FormValue("email"),
			"company", r.FormValue("company"),
			"phone", r.FormValue("country_code")+r.FormValue("phone"),
			"message", r.FormValue("message"),
		)
		if r.Header.Get("HX-Request") == "true" {
			s.renderPartial(w, successPartial)
			return
		}
		target := r.Header.Get("Referer")
		if target == "" {
			target = "/"
		}
		if u := strings.SplitN(target, "?", 2)[0]; u != "" {
			target = u
		}
		http.Redirect(w, r, target+"?sent=1#"+fallbackAnchor, http.StatusSeeOther)
	}
}

// ── Sitemap & robots ────────────────────────────────────────────────────────

type sitemapURL struct {
	Loc        string  `xml:"loc"`
	LastMod    string  `xml:"lastmod"`
	ChangeFreq string  `xml:"changefreq"`
	Priority   float64 `xml:"priority"`
}

// pagePaths lists every rendered HTML page, home first (as ""). Both the
// sitemap and the static export walk this, so they can never drift apart.
func pagePaths() []string {
	paths := []string{"", "/customer-success", "/onboarding", "/lead-generation", "/examples", "/security", "/privacy", "/terms"}
	for _, ex := range exampleList {
		paths = append(paths, "/examples/"+ex.Slug)
	}
	return paths
}

func (s *site) sitemap(w http.ResponseWriter, _ *http.Request) {
	type urlset struct {
		XMLName xml.Name     `xml:"urlset"`
		Xmlns   string       `xml:"xmlns,attr"`
		URLs    []sitemapURL `xml:"url"`
	}
	now := time.Now().Format("2006-01-02")
	set := urlset{Xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9"}
	for _, route := range pagePaths() {
		u := sitemapURL{Loc: s.URL + route, LastMod: now, ChangeFreq: "monthly", Priority: 0.7}
		if route == "" {
			u.ChangeFreq, u.Priority = "weekly", 1
		}
		set.URLs = append(set.URLs, u)
	}
	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	fmt.Fprint(w, xml.Header)
	_ = xml.NewEncoder(w).Encode(set)
}

func (s *site) robots(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprintf(w, "User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n", s.URL)
}

// llmsPages summarises each page for an AI agent reading /llms.txt. These are
// deliberately not the SEO meta descriptions: an agent scanning this file is
// deciding what to fetch, so it wants a plain factual line, not marketing copy.
var llmsPages = []struct {
	Path, Title, Summary string
}{
	{"/", "Home", "Overview of the platform: what Agents do for visitors, how client-side tools let them act, and the pricing enquiry form."},
	{"/customer-success", "Customer Success", "Agents that answer in-product “how do I…?” questions and take the action for the user rather than pointing at docs."},
	{"/onboarding", "Onboarding", "Conversational onboarding that configures the product in the user's own browser — no API integration, OAuth, or stored credentials."},
	{"/lead-generation", "Lead Generation", "Qualifying visitors, replying within seconds around the clock, and booking meetings outside working hours."},
	{"/security", "Security", "Encryption of stored conversations, role-based access control, and current SOC 2, GDPR and HIPAA compliance status."},
	{"/examples", "Examples", "Gallery linking to the live demos listed below."},
}

// llmsTxt serves /llms.txt (llmstxt.org): a short, structured map of the site
// for AI agents and crawlers. Built from the same exampleList the pages use,
// so demo and source URLs can never fall out of sync with the site itself.
func (s *site) llmsTxt(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")

	fmt.Fprint(w, "# Zephlo\n\n")
	fmt.Fprint(w, "> Zephlo turns a website into an Agent that takes actions for its visitors. It fills in their forms, queries their data, and drives the interface on their behalf — doing the task on the page, not just answering questions about it. One script tag, no backend integration.\n\n")
	fmt.Fprint(w, "Agents act through tools: plain functions registered in the browser that the Agent composes to finish real work — completing a multi-step application, filtering a dashboard and updating its charts, moving tickets across a board. Because tools run client-side, there are no APIs to build, no OAuth, and no credentials to store. Each Agent is also grounded in the site's own crawled content, so it understands the product it is acting on.\n\n")

	fmt.Fprint(w, "## Pages\n\n")
	for _, p := range llmsPages {
		fmt.Fprintf(w, "- [%s](%s%s): %s\n", p.Title, s.URL, strings.TrimSuffix(p.Path, "/"), p.Summary)
	}

	fmt.Fprint(w, "\n## Examples\n\n")
	fmt.Fprint(w, "Each is a live, standalone one-page site where the Agent does the work rather than describing it. The source repositories show the client-side tool registrations, which are the part worth reading.\n\n")
	for _, ex := range exampleList {
		fmt.Fprintf(w, "- [%s](%s/examples/%s): %s Live demo: %s — source: %s\n",
			ex.Title, s.URL, ex.Slug, ex.Tagline, ex.Demo, ex.Source)
	}

	fmt.Fprint(w, "\n## Resources\n\n")
	fmt.Fprintf(w, "- [Documentation](%s): guides for crawling, registering tools, and embedding the widget.\n", s.Links.Docs)
	fmt.Fprintf(w, "- [Sign up](%s): create an account and your first Agent.\n", s.Links.SignUp)
	fmt.Fprintf(w, "- [Dashboard](%s): manage Agents, crawls, and widget API keys.\n", s.Links.SignIn)
	fmt.Fprintf(w, "- [Contact sales](mailto:%s): talk to the team.\n", s.Links.SalesEmail)
}

// ── Main ────────────────────────────────────────────────────────────────────

func main() {
	dev := flag.Bool("dev", false, "serve templates/static from disk and reload on every request")
	export := flag.String("export", "", "render every page to this directory as a static site, then exit")
	flag.Parse()

	s, err := newSite(*dev)
	if err != nil {
		slog.Error("startup failed", "err", err)
		os.Exit(1)
	}

	if *export != "" {
		if err := s.export(*export); err != nil {
			slog.Error("export failed", "err", err)
			os.Exit(1)
		}
		return
	}

	mux := s.routes()
	addr := ":" + env("PORT", "3000")
	slog.Info("zephlo landing listening", "addr", addr, "dev", *dev)
	if err := http.ListenAndServe(addr, mux); err != nil {
		slog.Error("server stopped", "err", err)
		os.Exit(1)
	}
}

// routes wires every handler. Used to serve, and by export to render pages.
func (s *site) routes() *http.ServeMux {
	static, _ := fs.Sub(s.templateFS(), "static")

	mux := http.NewServeMux()
	mux.HandleFunc("GET /", s.home)
	mux.HandleFunc("GET /security", s.security)
	mux.HandleFunc("GET /customer-success", s.customerSuccess)
	mux.HandleFunc("GET /onboarding", s.onboarding)
	mux.HandleFunc("GET /lead-generation", s.leadGeneration)
	mux.HandleFunc("GET /examples", s.examples)
	mux.HandleFunc("GET /thanks", s.thanks)
	mux.HandleFunc("GET /privacy", s.privacy)
	mux.HandleFunc("GET /terms", s.terms)
	mux.HandleFunc("GET /examples/{slug}", s.exampleDetail)
	mux.HandleFunc("POST /api/pricing-lead", s.lead("pricing-success", "pricing"))
	mux.HandleFunc("POST /api/contact", s.lead("contact-success", "contact"))
	mux.HandleFunc("GET /sitemap.xml", s.sitemap)
	mux.HandleFunc("GET /robots.txt", s.robots)
	mux.HandleFunc("GET /llms.txt", s.llmsTxt)
	mux.Handle("GET /static/", http.StripPrefix("/static/", s.cacheControl(http.FileServer(http.FS(static)))))

	return mux
}

// ── Static export ───────────────────────────────────────────────────────────

// export renders the whole site into dir as plain files, ready for a static
// host (Cloudflare Pages). Pages go through the very same handlers the server
// uses, so the exported HTML is byte-for-byte what `go run .` would serve.
//
// Pages are written as flat .html files (see pageFile) so the URLs the site
// already links to resolve directly, with no redirect hop.
// The lead form POSTs are NOT exported — on Pages those are handled by the
// functions/ directory instead.
// pageFile maps a route to its file in the build: /security → security.html.
// A static host serves that at /security directly, whereas security/index.html
// would first redirect to /security/ — and every link on the site omits the
// trailing slash.
func pageFile(route string) string {
	if route == "" || route == "/" {
		return "index.html" // home
	}
	return strings.TrimPrefix(route, "/") + ".html"
}

func (s *site) export(dir string) error {
	if dir == "" || dir == "/" || dir == "." {
		return fmt.Errorf("refusing to export to %q — pass a build directory like dist", dir)
	}
	// Start clean so files from an earlier build never linger in a deploy.
	if err := os.RemoveAll(dir); err != nil {
		return err
	}

	mux := s.routes()
	// want is the status the route is expected to answer with — 200 for real
	// pages, 404 for the not-found page, which is a valid page to export.
	write := func(route, dest string, want int) error {
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, route, nil))
		if rec.Code != want {
			return fmt.Errorf("%s returned %d, wanted %d", route, rec.Code, want)
		}
		full := filepath.Join(dir, dest)
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			return err
		}
		return os.WriteFile(full, rec.Body.Bytes(), 0o644)
	}

	for _, page := range pagePaths() {
		route := page
		if route == "" {
			route = "/" // home
		}
		if err := write(route, pageFile(page), http.StatusOK); err != nil {
			return err
		}
	}
	// Deliberately not in pagePaths: /thanks is a post-submission landing
	// page, so it ships but stays out of the sitemap.
	if err := write("/thanks", pageFile("/thanks"), http.StatusOK); err != nil {
		return err
	}
	// 404.html is what a static host serves for an unknown URL. Requesting a
	// path no route matches makes the mux fall through to the home handler,
	// which answers 404 with the not-found page.
	if err := write("/_not-found", "404.html", http.StatusNotFound); err != nil {
		return err
	}
	for _, file := range []string{"/sitemap.xml", "/robots.txt", "/llms.txt"} {
		if err := write(file, file, http.StatusOK); err != nil {
			return err
		}
	}

	// The success partials the lead forms swap in. Exporting them lets the
	// Pages Function reply with the exact markup the Go server would have
	// rendered, instead of a hand-copied duplicate in TypeScript.
	for _, name := range []string{"pricing-success", "contact-success"} {
		var buf bytes.Buffer
		if err := s.tmpl["home"].ExecuteTemplate(&buf, name, nil); err != nil {
			return err
		}
		dest := filepath.Join(dir, "partials", name+".html")
		if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(dest, buf.Bytes(), 0o644); err != nil {
			return err
		}
	}

	// Copy static/ across verbatim — the pages reference it as /static/...
	root := s.templateFS()
	if err := fs.WalkDir(root, "static", func(p string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		b, err := fs.ReadFile(root, p)
		if err != nil {
			return err
		}
		dest := filepath.Join(dir, p)
		if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
			return err
		}
		return os.WriteFile(dest, b, 0o644)
	}); err != nil {
		return err
	}

	slog.Info("exported static site", "dir", dir, "pages", len(pagePaths()))
	return nil
}

// cacheControl lets browsers cache static assets aggressively in production —
// asset URLs carry ?v=<AssetVer>, so a new deploy naturally busts the cache.
// Dev mode disables caching so edits show up on plain refresh.
func (s *site) cacheControl(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if s.dev {
			w.Header().Set("Cache-Control", "no-store")
		} else {
			w.Header().Set("Cache-Control", "public, max-age=86400")
		}
		next.ServeHTTP(w, r)
	})
}
