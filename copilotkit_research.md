# CopilotKit — copilotkit.ai — Research Summary

A comprehensive walkthrough of the CopilotKit marketing site (www.copilotkit.ai),
its product surface, design language, pages, and published examples. Researched
live via browser-harness on Apr 23, 2026.

Legal entity: Tawkit, Inc. Founded / led by Atai Barkai (CEO & Co-Founder).
GitHub stars counter shown site-wide: 30.4K. Self-reported reach: "Trusted by
100k+ developers" and "over 10% of Fortune 500s."

## 1. What CopilotKit is (positioning)

CopilotKit brands itself as "The Enterprise-Ready Frontend Stack for Agents —
Bring users and AI agents together inside real applications."

The positioning is deliberately narrow and strategic: they are not an agent
framework, not an LLM, not an orchestrator. They are the FRONTEND layer that
sits between any agentic backend (LangGraph, Mastra, CrewAI, Pydantic AI,
Google ADK, Microsoft Agent Framework, Claude Agent SDK, custom, etc.) and the
real user-facing app (React, Next.js, Vue, Angular).

Three aligned pillars they repeatedly emphasize:
- Works with any LLM.
- Works with any agent framework (or no framework).
- Works with any agentic protocol (AG-UI, MCP, A2A).

They are the company behind AG-UI, an open bi-directional protocol between
agents and frontends — pitched as "16 real-time event types" that collapse the
M-frameworks × N-clients matrix into M + N.

Key marketing tagline repeated across pages:

    npx copilotkit@latest init

That single command is the primary entry-point CTA.

## 2. Design language

The site is light, modern, enterprise-SaaS — visually in the lineage of
Vercel / Linear / Stripe, but softer. Design characteristics:

- Background: very light off-white with subtle pastel gradient washes (mint
  green, pale lavender, soft blue). Dotted pattern backgrounds on some
  sections.
- Primary text: near-black, tight letter-spacing on large headlines.
- Accent colors: indigo/purple (brand), mint/teal green, amber/orange
  highlights for "Self-Learning" and similar callouts.
- Typography: modern geometric sans-serif throughout (Inter / Söhne-like).
  Uppercase small caps on all primary buttons ("GET STARTED", "LEARN MORE",
  "VIEW DOCUMENTATION", "TALK TO US").
- Hero treatment: gradient text on the hero h1 second line (purple → teal on
  "Frontend Stack for Agents").
- Buttons: solid black CTA with white text and a right arrow icon; secondary
  buttons are outlined/white.
- Cards: rounded corners, subtle shadows, occasional colored left-border
  accents (green, orange) acting as status/category stripes.
- Iconography: minimalist line icons + small UI-mockup illustrations on
  feature cards ("In-app AI copilot," "On the go," "Voice/images").
- Hero visual: an isometric 3D layered stack diagram on the right, showing
  Frontend SDKs → Threads + Persistence → Product Insights → Self-Learning →
  AG-UI, with arrows to user personas and backend tools (Pydantic AI, LLM
  boxes). Badges like "Enterprise", "Agentic Frontend", "Agentic Backend"
  pepper the diagram.

Overall feel: professional, technical, softly polished. Apple-adjacent whitespace,
developer-tool credibility.

## 3. Site map

Top navigation (left to right on the marketing site):
- Docs      → https://docs.copilotkit.ai/          (separate docs subdomain)
- Blog      → https://www.copilotkit.ai/blog
- Products  → https://www.copilotkit.ai/product
- Examples  → https://www.copilotkit.ai/examples
- Dojo      → https://dojo.ag-ui.com/              (separate AG-UI playground)
- Gen UI    → https://www.copilotkit.ai/generative-ui
- AG-UI     → https://www.copilotkit.ai/ag-ui
- MCP Apps  → https://www.copilotkit.ai/mcp-apps
- A2UI      → https://www.copilotkit.ai/ag-ui-and-a2ui
- Pricing   → https://www.copilotkit.ai/pricing

Right-side utility cluster:
- "TALK TO US" button
- Discord icon
- GitHub icon with "30.4K" stars counter
- Black "GET STARTED" CTA

Footer sections: Product (Products, Examples, Gen UI, MCP Apps, A2UI),
Resources (Docs, Dojo, Blog), About (Pricing, Careers), Legal
(Terms of service, Privacy Policy).

Persistent top announcement bar: "MCP Apps: Bring MCP Apps interaction to your
users with CopilotKit!" with a LEARN MORE button.

## 4. Homepage (/)

The homepage is long (≈7,000px tall) and structured as follows:

1. Hero — Headline "The Enterprise-Ready Frontend Stack for Agents", subtitle
   "Bring users and AI agents together inside real applications". Dual CTAs:
   VIEW DOCUMENTATION (outlined) and GET STARTED (black).
2. Four expandable feature cards (accordion on left, isometric stack diagram
   on right):
   - Frontend SDKs — "Customizable pre-built components or full headless
     code control. Drop in a fully-featured copilot UI, or go headless and
     build your own. React, Next.js, and Vue SDKs with streaming-first
     architecture that just works."
   - Threads + Persistence (tagged Enterprise) — "Agent-user interaction
     threads are no longer just text↔text. Five flavors of generative UI,
     human-in-the-loop, state synchronization, voice interactions, file
     uploads, and full multimodality. A single solution that just works and
     auto-migrates as the ecosystem matures. Self-hosted on your infra."
   - Product Insights (tagged Enterprise) — "Observability for agentic flows.
     Visualize event streams, identify friction points, trace decision paths,
     and measure real outcomes — not just token counts."
   - Self-Learning (tagged Enterprise) — "CLHF — Continuous Learning from
     Human Feedback. Close the loop. Agents automatically adapt and improve
     for each learning container you define. Every thumbs-up, edit, and
     rejection makes the system smarter."
3. AG-UI callout — "The Agent-User Interaction Protocol. CopilotKit is the
   company behind AG-UI, an open protocol that bridges AI agents and
   frontends through 16 real-time event types. Instead of M frameworks × N
   clients, you get M + N."
4. First-Party Partners strip + enterprise trust copy ("over 10% of Fortune
   500s").
5. Three "Explore" cards (side-by-side):
   - Dive into Development → CopilotKit Docs, Feature Viewer, with the
     `npx copilotkit@latest init` code block.
   - Deploy Agentic Features → Pricing, Contact CopilotKit.
   - Learn about Agentic Apps → The AG-UI Protocol, Generative UI Patterns.
6. "Our Place in the Stack" — a full architectural diagram of the Agentic
   Application Stack. User-Facing Agentic Applications on top; CopilotKit
   sits in the middle; "Bring any compatible Agent", "Bring your own
   framework", "Use without a framework", "Use any LLM" bullets underneath.
7. Use Cases — two cards each with a LIVE DEMO link:
   - SaaS Copilot — "Intent-oriented interface for SaaS applications."
   - Co-Creation Copilot — "Copilot that works with the user to create more,
     better and faster."
8. UI Customization spectrum — "From Headless UI to Pre-built Components."
   Claims support for "the full spectrum of customization needs: Headless
   UI → Pre-built Customizable Components."
9. Agent Connections — "Direct Connection or Low Level Orchestration.
   CopilotKit can connect directly to any Agentic Protocol. CopilotKit can
   connect through AG-UI to any Agentic Protocol."
10. Closing CTA — "Are you ready? Enhance your applications with powerful AI
    capabilities." TALK TO US / TRY FOR FREE, plus the `npx copilotkit@latest
    init` code block again.

## 5. Products page (/product)

Hero: "Products & Features — Everything you need to bring your agents to
your users." The page organizes the platform into three tiers:

### 5.1 Core Framework (Open Source, MIT License — free, self-hosted)

"The foundation of CopilotKit — everything you need to get started building
AI copilots with the agent(s) of your choice."

Features:
- Managed Agent Connections — "Built-in support for emerging agent
  frameworks, protocols and standards — connect to LLMs, framework agents,
  MCP servers, and A2A meshes without custom integration code.
  Future-proof architecture built on open standards. Interoperability
  without lock-in."
- In-app Actions — "Define actions that AI agents can execute directly
  within your application — from simple API calls to complex multi-step
  workflows. Agents that actually do things, not just chat."
- Generative UI — "AI agents dynamically generate and render UI components
  based on conversation context — creating rich, interactive interfaces
  that go far beyond text."
- Realtime Context Awareness — "Agents automatically stay aware of
  application state, user context, and environmental changes — no manual
  context management required."
- Agent-App State Sync — "Bidirectional state synchronization between
  agents and your application — agents read app state, app reacts to agent
  actions, everything stays in sync."
- React Client — "Official CopilotKit client library for React applications
  with hooks, components, and full TypeScript support."

### 5.2 Premium Features (Subscription required)

"Advanced capabilities for teams that need full control over their copilot
experience."

- Fully Headless UI — "Build completely custom copilot interfaces without
  any of CopilotKit's default UI components — full design freedom from the
  ground up."
- Observability Hooks — "Programmatic access to all agent events, state
  changes, and performance metrics — build custom monitoring, logging, and
  analytics tailored to your needs."
- Angular Client (Enterprise only) — "Official CopilotKit client library
  for Angular applications with full TypeScript support and Angular-native
  patterns."
- CopilotKit Inspector — "Debug and inspect all agent-user interactions in
  real-time and historically. X-ray vision into your agents."

### 5.3 Services / Enterprise (Self-hosted or CopilotKit Cloud)

"Persistence-backed features that enable continuous learning, optimization,
and rich user experiences."

- Dashboard & IaC CI/CD — "Visual dashboard for monitoring agent
  performance plus Infrastructure as Code for automated deployment and
  testing in CI/CD pipelines."
- Thread History & Branching — "End users can resume old conversations and
  branch from any point in conversation history — creating explorable,
  non-linear conversation experiences."
- A/B Testing for Agentic Applications (Coming Soon) — "Run experiments on
  agent behavior, prompts, flows, and UI with statistical analysis —
  data-driven optimization for AI applications."
- Data Lakehouse & Analytics / Learning Layer (Coming Soon) — "Query and
  analyze all agent-user interactions across your application — a complete
  record of every conversation, action, and outcome."
- Self-improving Agents with RL / Learning Layer (Coming Soon) — "Agents
  that learn and improve from interactions without manual intervention —
  using reinforcement learning to optimize behavior over time."

The page ends with a "DOWNLOAD: PRODUCTS OVERVIEW" PDF CTA.

## 6. Examples page (/examples) — the showcase apps

This is the gallery of prebuilt CopilotKit example apps. All six have a live
demo embedded as an iframe on their detail page, plus a public GitHub
source link.

### 6.1 Chat with your data
- Detail page: /examples/chat-with-your-data
- Live demo: https://chat-with-your-data.vercel.app/
- Source: github.com/CopilotKit/CopilotKit/tree/main/examples/v1.x/chat-with-your-data
- Summary: "Transform your data visualization experience with an AI-powered
  dashboard assistant."
- UI in detail: Titled "Data Dashboard — Interactive data visualization with
  AI assistance." Top row is six KPI cards (Total Revenue $51,240, Total
  Profit $38,378, Customers 2,584, Conversion Rate 12.3%, Avg Order Value
  $19.83, Profit Margin 74.9%). Below are three charts: a Sales Overview
  area/line chart with Sales (blue) / Profit (green) / Expenses (red) across
  Jan–Dec 2022; a Product Performance purple bar chart (Smartphone, Graphic
  Tee, Dishwasher, Blender, Smartwatch); and a Sales by Category donut
  chart (Electronics, Clothing, Home & Kitchen, Other, Books). A right-side
  "Data Assistant" copilot chat panel greets with "Hello, I'm here to help
  you understand your data" and an input placeholder "Ask about sales,
  trends, or metrics…" — branded "Powered by CopilotKit."
- Demonstrates: context-aware chat over live app state, natural-language
  querying of dashboard data, pre-built sidebar copilot UI.

### 6.2 Travel Planner
- Detail page: /examples/travel-planner
- Live demo: https://examples-coagents-ai-travel-app.vercel.app/
- Source: github.com/CopilotKit/CopilotKit/tree/main/examples/v1.x/travel
- Summary: "Plan your next trip with AI-powered travel planner."
- UI in detail: Full-screen interactive map of Manhattan as the background
  (beige/green/blue tones). A floating "Business Trip to NYC" panel on the
  left (black header with plane icon) lists numbered place cards — (1)
  Empire State Building ★4.8, (2) Central Park ★4.7, (3) Times Square ★4.6
  — each with address pin, star rating, and short description, plus a "+"
  button to add places. Numbered black circular markers (1, 2, 3) on the
  map match the list. A right-side "Travel Planner" chat panel with
  "Powered by CopilotKit" handles trip-planning conversation.
- Demonstrates: generative UI cards (place entries added by the agent into
  the app canvas), state sync between chat and map pins, a co-creation
  workspace pattern.

### 6.3 State Machine Copilot
- Detail page: /examples/state-machine-copilot
- Live demo: https://state-machine-copilot.vercel.app/
- Source: github.com/CopilotKit/CopilotKit/tree/main/examples/v1.x/state-machine
- Summary: "Transform complex conversational flows into manageable state
  machines."
- UI in detail: Two-pane layout. Left pane has tabs "Orders" and "State
  Visualizer" — the Orders tab shows a car-sales order card (ID #001, "2025
  Hyundai Kona", $25,000, card ending 3456, customer John Doe). Right pane
  is a chat canvas with dotted-grid background and an AI assistant branded
  "Fio" (pink smiling robot avatar) that renders inline generative UI cards
  as it moves through conversation states. Pink/magenta accents for the
  active tab underline and Fio avatar; otherwise the CopilotKit light
  palette.
- Demonstrates: how to structure a deterministic multi-step conversational
  flow as a state machine, with a live state visualizer and generative UI
  responses per state — a pattern for agentic sales/onboarding/support
  workflows.

### 6.4 Form Filling Copilot
- Detail page: /examples/form-filling-copilot
- Live demo: https://form-filling-copilot.vercel.app/
- Source: github.com/CopilotKit/CopilotKit/tree/main/examples/v1.x/form-filling
- Summary: "Use CopilotKit to fill out complex forms with a conversational
  agent."
- UI in detail: Split view — main "Security Incident Report" form card
  (subtitle "Cyber Security Incident Report") on the left/center with fields
  Full Name (placeholder "John Doe"), Email ("john.doe@example.com"),
  Incident Type, Date of Incident (more below the fold). A dismissible
  right-side "✨ Incident Report Assistant" chat panel with the AI greeting
  "offering to guide the user through filing incident reports," standard
  message actions (regenerate, copy, thumbs up/down), and a "Type a
  message…" input. Yellow sparkle accent on the assistant header.
- Demonstrates: agent-driven form completion via conversation, writing back
  into a bound form schema — the canonical enterprise workflow for SaaS
  copilots.

### 6.5 Project Manager (Mastra PM Canvas)
- Detail page: /examples/project-manager
- Live demo: https://mastra-pm-canvas.vercel.app/
- Source: github.com/CopilotKit/mastra-pm-canvas
- Summary: "Manage your software projects with an AI-powered project
  manager."
- UI in detail: Two-pane layout on a purple/indigo gradient canvas. Main
  canvas (≈85% width) stacks: (a) "My Project" header with description, (b)
  a horizontal "Team Members" row with four circular-avatar cards — Tyler
  Slaton, Suhas Deshpande, John Rae Grant (PM), Nathan Tarbert (Lead
  DevRel) — each with a green online dot, and (c) a Kanban-style task board
  with three translucent-purple columns: To Do (0), In Progress (1 — "Build
  the product" assigned to Tyler Slaton), Done (0). Cards are draggable.
  Right edge (≈15% width) holds a white "Popup Assistant" panel with a
  purple header, close (×), greeting from the Mastra PM agent ("👋 Hi,
  there!…"), message action icons, "Type a message…" input with send
  arrow, and a "Powered by CopilotKit" footer.
- Demonstrates: CopilotKit paired with Mastra (a competing agent framework)
  to manage a Kanban project board conversationally — kanban state sync,
  team roster awareness, drag-and-drop plus agent manipulation.

### 6.6 Research Canvas
- Detail page: /examples/canvas-research
- Live demo: https://examples-coagents-research-canvas-ui.vercel.app/
- Source: github.com/CopilotKit/CopilotKit/tree/main/examples/v1.x/research-canvas
- Summary: "A research canvas to help you plan, track, and organize your
  research."
- UI in detail: Titled "Research Helper" in a dark navy header. Two-column
  layout — left ≈75% is the research workspace (Research Question input,
  a Resources section with an indigo "Add Resource +" button and empty
  state, a large resizable Research Draft textarea, and a bottom-left model
  selector currently set to "OpenAI"); right ≈25% is a persistent
  full-height CopilotKit chat sidebar greeting "Hi! How can I assist you
  with your research today?" with a "Type a message…" input and "Powered
  by CopilotKit" footer.
- Demonstrates: the canonical "chat + canvas" co-creation pattern (one of
  the three Generative UI surfaces CopilotKit teaches — see §8) with
  bidirectional state sync between conversation and the research artifacts,
  plus pluggable LLM choice.

## 7. The Dojo (dojo.ag-ui.com)

Separate interactive playground hosted at a sibling domain.
Layout: left sidebar with an "INTEGRATIONS" dropdown and a "VIEW" toggle
(Preview / Code / Docs). Right pane is a blank canvas that renders the
selected integration. Purpose: let developers try each supported agentic
backend against AG-UI/CopilotKit live, with toggles between a live Preview,
the Code, and the Docs for that integration.

Integrations exposed in the dropdown (captured live):
- Open Agent Spec (LangGraph)
- Open Agent Spec (Wayflow)
- LangGraph (Python)
- LangGraph (FastAPI)
- LangGraph (Typescript)
- Mastra
- Mastra Agent (Local)
- Spring AI
- Pydantic AI
- Google ADK
- Microsoft Agent Framework (.NET)
- Microsoft Agent Framework (Python)
- AG2
- Agno
- LlamaIndex
- CrewAI
- A2A (Direct)
- Middleware Starter
- Server Starter
- Server Starter (All Features)
- A2A
- AWS Strands
- Claude Agent SDK (Python)
- Claude Agent SDK (Typescript)
- Langroid

This list is the most concrete evidence of CopilotKit's "works with any
agent framework" positioning — 20+ first-class integrations across Python,
TypeScript, .NET, Java (Spring AI), and both Google and Microsoft stacks.

## 8. Generative UI page (/generative-ui)

A long educational/design-patterns article that defines CopilotKit's
intellectual framework for Gen UI. Covers:

### Application Surfaces — where Gen UI shows up
1. Chat (threaded interaction) — Slack-like conversational surface; the app
   brokers each turn; generative UI appears inline as cards/blocks/tool
   responses. Examples named: Slack bots, Discord bots, Intercom AI Agent,
   Zendesk AI, GitHub Copilot Chat, Notion AI Chat.
2. Chat+ (Co-Creator Workspace) — side-by-side layout: chat in one pane,
   dynamic canvas in another. Ideal for creation, planning, editing,
   multi-step tasks. Examples: Figma AI, Notion AI workspace, Google
   Workspace Duet side panel, Replit Ghostwriter paired editor.
3. Chatless (Generative UI integrated into application UI) — the agent
   doesn't talk to the user directly; the app renders agent output as part
   of its native interface. Examples: Microsoft 365 Copilot, Linear
   Insights, Superhuman AI triage, HubSpot AI Assist, Datadog Notebooks AI
   panels.

### Two attributes for classifying Gen UI
- Freedom of Expression (fixed → open-ended; static components vs arbitrary
  HTML, with declarative in the middle).
- Who has Control (Agent/LLM vs Programmer/App developer).

### Three types of Generative UI
1. Static — UI chosen from a fixed set of hand-built components. High
   polish and brand consistency; engineering-intensive; frontend codebase
   grows with agent capabilities. Example: "Using CopilotChat with AG-UI."
2. Open-Ended — agents return arbitrary HTML/iframes/free-form markup.
   Maximum flexibility; security, performance, and styling concerns.
   Example: "Using MCP-UI & ChatGPT Apps SDK."
3. Declarative — agents return a structured spec (cards, lists, forms,
   widgets) that the frontend interprets. Balance of structure and
   flexibility; multi-renderer portability. Example: "Using Open-JSON-UI."

### Ecosystem mapping table (as published)
    Approach       Examples                        Strengths                       Weaknesses
    Static         AG-UI, CopilotChat, useAgent    Fidelity, reliability, brand    Engineering intensive, linear growth
    Open-Ended     MCP-UI, ChatGPT Apps            Unlimited creativity            Hard to style, secure, or port
    Declarative    Open-JSON-UI, A2UI              Balanced, scalable, multi-rend. Limited full customization

### Their takeaway
"AG-UI and CopilotKit are Gen UI Agnostic." AG-UI is the universal runtime
that works with A2UI, MCP-UI, Open-JSON-UI, and custom specs. CopilotKit
works with any generative UI and uses AG-UI to connect agent to frontend.

## 9. AG-UI page (/ag-ui)

"AG-UI Protocol — The Open Protocol for Agent<->User Interaction."
Positioned as "the general-purpose, bi-directional connection between a
user-facing application and any agentic backend." Emphasizes transparency,
reliability, and user alignment.

What AG-UI enables (feature chips shown):
- Shared State
- Tool-Based GenUI
- Subgraphs ("Coordinate multiple agents across sub-tasks, streaming their
  results into a unified, coherent experience.")
- Agentic Chat
- Human in the Loop
- Agentic GenUI
- Predictive Updates

Why AG-UI matters (three columns):
- For Developers — "Build agentic apps faster with a standard interface
  for agent ↔ UI communication."
- For Enterprises — "Deploy with confidence, with governance and analytics
  built in at the boundary."
- For the Ecosystem — "Prevent fragmentation with a shared protocol
  designed for broad adoption."

CopilotKit additions on top of AG-UI:
- First-party React and Angular AG-UI clients, with community clients across
  Golang, Rust, Java, and more. Example snippet shown:

      // React AG-UI Client
      import { useAGUI } from '@copilotkit/react'

      const MyComponent = () => {
        const { agent, ui } = useAGUI()
        // Your component logic
      }

- Copilot Cloud — "Hosted AG-UI Platform."
  - Protection — "Guardrails at the boundary: prevent prompt injection,
    block sensitive data leaks, enforce brand and compliance guidelines."
  - Cockpit (Coming Soon) — "AI product analytics for visibility into
    every agent ↔ user interaction."
  - Learning (Coming Soon) — "Support for self-improving agents through
    implicit human feedback (RLiHF)."

FAQ snippets:
- AG-UI vs MCP vs A2A: "MCP handles context and model communication, A2A
  handles agent-to-agent coordination, AG-UI is the layer of interaction
  between the user, the application, and the agent."
- A2UI vs AG-UI: "Despite the similar acronyms, these are different and work
  well together. A2UI is a generative UI specification (from Google) - which
  agents can use to deliver UI widgets, where AG-UI provides the complete
  bi-directional runtime connection."

## 10. MCP Apps page (/mcp-apps)

"MCP Apps + CopilotKit — Build MCP-powered interactions directly into your
agentic application."

Core premise: MCP Apps were originally designed to run inside chat-based AI
hosts like ChatGPT and Claude. CopilotKit + AG-UI bring them into your own
application, where you control UX, permissions, workflows, and agent
behavior.

What MCP Apps are:
- Declared by MCP servers, representing distinct user interactions — not
  just function calls.
- Each MCP App is a "purpose-built interaction surface" the host can render.
- A single MCP server can expose multiple MCP Apps, each optimized for a
  different user task.
- Interactive capabilities; open-ended by design (UI is not prescribed by
  the spec); bring non-text interaction into agent workflows.

CEO quote (Atai Barkai): "MCP Apps are a game-changer. They join protocols
like MCP, A2A, AG-UI and Generative UI specs to unlock unprecedented
composability and UX. This is what we built CopilotKit for: connecting any
app to any agentic backend. With MCP Apps, that vision just got
supercharged."

Value pillars:
- Tool-Native UI — "Let agents open pickers, forms, and approvals instead
  of asking users to respond in text."
- Structured Input — "Collect structured input that agents can reliably act
  on."
- In-Product User Retention — "Keep users inside your product, rather than
  bouncing them to external chat tools."
- Workflow Integrated Actions — "Blend agent actions directly into existing
  workflows and screens."

Stack diagram (top to bottom):
- CopilotKit: handles discovery, renders UI, manages user interaction,
  integrates results back into the application.
- AG-UI: manages all communication between agentic backend and user-facing
  application.
- AI Agents: decide when a user needs to be involved and which MCP App to
  invoke.
- MCP Servers: declare and expose MCP Apps as capabilities.
- MCP Apps: define the interactive experiences delivered to users.

## 11. AG-UI and A2UI page (/ag-ui-and-a2ui)

Disambiguation page. Key points:
- AG-UI is the Agent–User Interaction protocol (bi-directional runtime
  connection, app ↔ backend).
- A2UI is a declarative Generative UI spec originated by Google (JSONL-based
  and streaming, designed for platform-agnostic rendering).
- CopilotKit is a launch partner with Google on the official A2UI release
  and fully supports A2UI.
- The page also lists the generative UI spec landscape:
    A2UI        — Google            — declarative, LLM-friendly, JSONL-based, streaming, platform-agnostic.
    Open-JSON-UI — OpenAI            — open standardization of OpenAI's internal declarative Gen UI schema.
    MCP-UI (labeled as "A2UI" in the published table — likely a typo; see §12 Caveats)
                 — Microsoft + Shopify — fully open, iframe-based Generative UI standard extending MCP for user-facing experiences.

How they work together (4 steps):
1. Agents generate UI using a generative UI spec like A2UI.
2. AG-UI transports that specification from the agent to the application.
3. The application renders the UI components per spec.
4. User interactions flow back through AG-UI to the agent.

Both pages (§8 and §11) emphasize the same central claim: AG-UI is the
universal runtime, and any generative UI spec can be carried over it.

## 12. Pricing page (/pricing)

Three tiers:

DEVELOPER / INDIVIDUAL — Free forever
- One developer seat
- Copilot Cloud Hosting
- Up to 50 Monthly Active Users (MAUs)
- Discord Community Support
- Platform: Core Framework + Premium Features + Copilot Intelligence
- CTA: GET STARTED FOR FREE

TEAM / TEAMS — $1,000 per seat/month
- Volume discounts on seats and MAUs
- Copilot Cloud Hosting
- 100 MAUs per seat
- Overage: $100 per 100 MAU
- Dedicated Slack Support
- Team Accounts & Collaboration
- Includes all features from Developer
- Platform: Core Framework + Premium Features + Copilot Intelligence
- CTA: BUILD WITH YOUR TEAM

ENTERPRISE / SCALE — Custom (from $5K/mo)
- Volume discounts on seats and MAUs
- Cloud, VPC, or On-Prem deployment
- Pooled seats and MAUs
- Offline License Key Validation
- Fixed Pricing Packages Available
- Premium Support & Prioritized Roadmap
- SSO & Enterprise Security
- Service Level Agreement (SLA)
- Internationalization & Accessibility
- Angular Client
- Includes all features from Developer and Team
- CTA: GET A CUSTOM PLAN

Plus an always-free self-hosted open-source tier:
"CopilotKit Open Source — Access core CopilotKit features on an always
free, self-hosted framework." (MIT Licensed, repo at github.com/CopilotKit)

## 13. Recurring site-wide elements

- Top notification bar (always present): "MCP Apps: Bring MCP Apps
  interaction to your users with CopilotKit!" with a LEARN MORE button →
  /mcp-apps. This is the loudest push at the time of research; MCP Apps is
  clearly the current marketing priority.
- Final-section CTA repeated on almost every page: "Are you ready? Enhance
  your applications with powerful AI capabilities — TALK TO US / TRY FOR
  FREE" + the `npx copilotkit@latest init` code block.
- GitHub stars ("30.4K") surfaced in the nav as a social-proof anchor.
- Multiple pages offer a PDF download ("DOWNLOAD: PRODUCTS OVERVIEW",
  "DOWNLOAD: GENERATIVE UI EXPLAINED", "DOWNLOAD: AG-UI AND A2UI
  EXPLAINED") — clear lead-gen on enterprise intent.

## 14. Key takeaways (strategic reading)

1. CopilotKit positions itself as the frontend layer of an agentic stack they
   are actively defining — AG-UI (protocol), A2UI (launch partner with
   Google), MCP Apps (new integration thrust). They are pitching themselves
   as the neutral, interoperable connective tissue, not a walled garden.
2. Product segmentation is clean: free-forever OSS core, paid SaaS for
   headless UI / observability / Angular, and enterprise add-ons that are
   themselves the ones with the most strategic value long-term
   (persistence, A/B testing, self-learning / RLiHF — all explicitly
   "Coming Soon" signaling their roadmap bets).
3. Their distribution strategy is framework-agnostic by design: Dojo ships
   20+ integrations across LangGraph, Mastra, CrewAI, Pydantic AI, Google
   ADK, Microsoft Agent Framework, Claude Agent SDK, Spring AI, LlamaIndex,
   AWS Strands, AG2, Agno, Langroid, etc. They win if the ecosystem
   fragments and customers want one frontend that spans it all.
4. The design language is intentionally enterprise-polished but
   developer-credible — light pastel backgrounds, crisp typography, black
   CTAs, gradient hero text, isometric architecture diagrams. It is
   positioning for Fortune 500 buyers, not hobbyist React devs.
5. The examples gallery is the single best artifact to study for
   implementation patterns: six distinct copilot archetypes covering
   dashboards, maps, state machines, forms, Kanban boards, and research
   canvases — every one of which could be mapped directly to a FlunkieAI
   use case.

## 15. Caveats on what the site doesn't show

- The "A2UI" row in the ecosystem table (§11) appearing twice is likely a
  typo on their site — the second row (Microsoft + Shopify, "iframe-based,
  extending MCP") is almost certainly MCP-UI, not A2UI. Worth noting if
  quoting the table verbatim.
- The Travel Planner, Project Manager, Research Canvas, and Form Filling
  demos run as embedded iframes on the detail pages; the iframes don't
  always hydrate quickly. I described each from the directly-loaded live
  demo URLs (§6), which is more accurate.
- The Blog, Careers, Contact, and individual blog posts were not inspected
  in depth for this report — they are linked but not analyzed here.
- Pricing values ($1,000/seat/month; $5K/mo enterprise floor; 50/100 MAU
  tiers) are captured as of Apr 23, 2026 and may change.

---

Sources (all visited live):
- https://www.copilotkit.ai/
- https://www.copilotkit.ai/product
- https://www.copilotkit.ai/examples (+ six example detail pages)
- https://www.copilotkit.ai/generative-ui
- https://www.copilotkit.ai/ag-ui
- https://www.copilotkit.ai/mcp-apps
- https://www.copilotkit.ai/ag-ui-and-a2ui
- https://www.copilotkit.ai/pricing
- https://dojo.ag-ui.com/
- Six live demo apps:
  - https://chat-with-your-data.vercel.app/
  - https://examples-coagents-ai-travel-app.vercel.app/
  - https://state-machine-copilot.vercel.app/
  - https://form-filling-copilot.vercel.app/
  - https://mastra-pm-canvas.vercel.app/
  - https://examples-coagents-research-canvas-ui.vercel.app/
