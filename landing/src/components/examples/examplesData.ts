export type IconName =
  | "BookOpen"
  | "Headphones"
  | "ShoppingBag"
  | "Compass"
  | "Building2"
  | "MessageSquareText";

export type Source = {
  title: string;
  url: string;
};

export type FollowUp = {
  label: string;
  /** If set, clicking this follow-up sends a new user message with this text. */
  sendAs?: string;
  /** External link (opens in new tab). */
  href?: string;
};

export type ScriptStep =
  | {
      role: "assistant";
      content: string;
      /** Milliseconds to simulate "thinking" before rendering. */
      typingMs?: number;
      sources?: Source[];
      followUps?: FollowUp[];
    }
  | {
      role: "user";
      content: string;
    };

export type Example = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: IconName;
  accentLabel: string;
  /** Short, human-sized bullets — what this Agent actually does. */
  highlights: string[];
  /** Code/integration hint shown in the detail page sidebar. */
  embed: {
    scriptSrc?: string;
    agentId: string;
  };
  /** Opening prompt suggestions visible in the chat's empty state. */
  suggestedPrompts: string[];
  /** Scripted conversation — auto-plays + user can click follow-ups to branch. */
  script: ScriptStep[];
  /** Query string sent to the dashboard's agent-creation flow as a hint. */
  templateSlug: string;
};

export const examples: Example[] = [
  {
    slug: "docs-agent",
    title: "Documentation Agent",
    tagline: "Turn your docs into a conversation.",
    description:
      "Answer developer questions with answers grounded in your docs, cite the exact page, and jump users to the right section when they ask.",
    icon: "BookOpen",
    accentLabel: "Developers",
    highlights: [
      "Cites the exact docs page for every answer",
      "Navigates users to the right section on click",
      "Flags missing pages so your team can fill gaps",
    ],
    embed: { agentId: "demo-docs" },
    suggestedPrompts: [
      "How do I rotate an API key?",
      "What's the rate limit?",
      "How do I add a custom tool?",
    ],
    script: [
      { role: "user", content: "How do I rotate an API key?" },
      {
        role: "assistant",
        typingMs: 900,
        content:
          "Rotating a key is two steps. Go to **Settings → API keys** and click **Rotate**, then update the `ZEPHLO_KEY` env var in your deployment. Old keys stay valid for 24h so you can roll without downtime.",
        sources: [
          { title: "docs/api-keys#rotate", url: "#" },
          { title: "docs/env-vars", url: "#" },
        ],
        followUps: [
          { label: "Take me to Settings", sendAs: "Open the settings page for me" },
          { label: "Show me the env-var doc", sendAs: "Show the env-var doc" },
        ],
      },
      { role: "user", content: "Open the settings page for me" },
      {
        role: "assistant",
        typingMs: 700,
        content:
          "Opening **Settings → API keys** now. I'll stay minimized while you work — tap the bubble if you need anything else.",
      },
    ],
    templateSlug: "docs-agent",
  },
  {
    slug: "support-agent",
    title: "Customer Support Agent",
    tagline: "Resolve issues inside your product.",
    description:
      "Look up orders, issue refunds, file tickets, and escalate to a human when confidence drops. Every action is audit-logged.",
    icon: "Headphones",
    accentLabel: "Support",
    highlights: [
      "Takes real actions — refunds, cancellations, ticket filing",
      "Escalates to humans when confidence is low",
      "Every tool call is logged for audit & compliance",
    ],
    embed: { agentId: "demo-support" },
    suggestedPrompts: [
      "My last invoice looks wrong",
      "I need to cancel my subscription",
      "Where's my order?",
    ],
    script: [
      { role: "user", content: "My last invoice looks wrong" },
      {
        role: "assistant",
        typingMs: 1100,
        content:
          "I pulled up invoice **#INV-38821** for April. The extra $19 is your seat add-on, pro-rated from Apr 4. Want me to refund the seat or remove the add-on going forward?",
        sources: [{ title: "Billing — INV-38821", url: "#" }],
        followUps: [
          { label: "Refund the seat", sendAs: "Refund the seat please" },
          { label: "Remove the add-on", sendAs: "Just remove the add-on for next month" },
          { label: "Talk to a human", sendAs: "I'd rather talk to a human" },
        ],
      },
      { role: "user", content: "Refund the seat please" },
      {
        role: "assistant",
        typingMs: 800,
        content:
          "Refund of **$19.00** filed — you'll see it back on your card in 3–5 days. Ticket **SUP-1042** tracks it. Anything else I can do?",
        followUps: [
          { label: "That's all, thanks", sendAs: "That's all for now, thanks" },
        ],
      },
    ],
    templateSlug: "support-agent",
  },
  {
    slug: "ecommerce-agent",
    title: "E-commerce Assistant",
    tagline: "Product discovery in the cart, not a form.",
    description:
      "Help shoppers find the right product, build bundles, and clear checkout hurdles — all without leaving the page they're on.",
    icon: "ShoppingBag",
    accentLabel: "Retail",
    highlights: [
      "Narrows down catalog by fit, price, and stock",
      "Adds items to the cart for the user",
      "Handles checkout friction before the drop-off",
    ],
    embed: { agentId: "demo-ecommerce" },
    suggestedPrompts: [
      "Running shoe under $140, wide fit",
      "Best gift for a new dad",
      "Is the Nova Road 3 true to size?",
    ],
    script: [
      { role: "user", content: "Need a running shoe under $140, wide fit" },
      {
        role: "assistant",
        typingMs: 1000,
        content:
          "Three in stock in wide fit under $140:\n\n1. **Nova Road 3** — $129\n2. **Pulse Glide** — $119\n3. **Trail Light** — $135\n\nWhich one are you leaning toward?",
        followUps: [
          { label: "Add Pulse Glide, size 11", sendAs: "Add the Pulse Glide in size 11 to cart" },
          { label: "Compare Nova & Pulse", sendAs: "Compare the Nova Road 3 and Pulse Glide" },
        ],
      },
      { role: "user", content: "Add the Pulse Glide in size 11 to cart" },
      {
        role: "assistant",
        typingMs: 700,
        content:
          "Added ✓ **Pulse Glide** (W) size 11. Cart total **$119** — free shipping kicks in at $150. Want to see socks or insoles that pair well?",
        followUps: [
          { label: "Yes, show me pairings", sendAs: "Yes, show pairings" },
          { label: "Just checkout", sendAs: "Take me to checkout" },
        ],
      },
    ],
    templateSlug: "ecommerce-agent",
  },
  {
    slug: "onboarding-agent",
    title: "SaaS Onboarding Guide",
    tagline: "Turn setup into a conversation.",
    description:
      "Walk new users through connecting data, inviting teammates, and running their first workflow — reducing time-to-value from days to minutes.",
    icon: "Compass",
    accentLabel: "Activation",
    highlights: [
      "Detects where the user got stuck and picks up from there",
      "Triggers real setup actions on the user's behalf",
      "Celebrates the first success to drive retention",
    ],
    embed: { agentId: "demo-onboarding" },
    suggestedPrompts: [
      "I'm stuck on step 2",
      "How do I invite my team?",
      "What should I do first?",
    ],
    script: [
      { role: "user", content: "I'm stuck on step 2" },
      {
        role: "assistant",
        typingMs: 1000,
        content:
          "You're connecting **Google Workspace**. You got past OAuth but the sync hasn't kicked off. I can trigger it for you — it usually takes 2–3 minutes. Run it now?",
        followUps: [
          { label: "Yes, trigger sync", sendAs: "Yes trigger the sync" },
          { label: "I'll do it later", sendAs: "I'll come back to this later" },
        ],
      },
      { role: "user", content: "Yes trigger the sync" },
      {
        role: "assistant",
        typingMs: 900,
        content:
          "Syncing now — your first contacts are indexing. While we wait, want to invite your teammate **Maya** so she's ready when you're done?",
        followUps: [
          { label: "Invite Maya", sendAs: "Invite Maya" },
          { label: "Skip for now", sendAs: "Skip invite for now" },
        ],
      },
    ],
    templateSlug: "onboarding-agent",
  },
  {
    slug: "internal-kb-agent",
    title: "Internal Knowledge Agent",
    tagline: "Your company wiki, on tap.",
    description:
      "HR policies, IT how-tos, engineering runbooks — one Agent that knows the whole wiki and stops the same questions from flooding Slack.",
    icon: "Building2",
    accentLabel: "Internal",
    highlights: [
      "Scoped to an employee's org, team, and role",
      "Answers with policy excerpts, not guesses",
      "SSO-gated — never leaks to the public internet",
    ],
    embed: { agentId: "demo-internal-kb" },
    suggestedPrompts: [
      "How many PTO days do I get?",
      "How do I expense travel?",
      "What's the VPN setup?",
    ],
    script: [
      { role: "user", content: "How many vacation days do I get?" },
      {
        role: "assistant",
        typingMs: 900,
        content:
          "Full-time employees get **22 PTO days** a year plus 10 company holidays. You've used **4 days** of your 22 in 2026 so far.",
        sources: [{ title: "HR Handbook §3.2 — PTO", url: "#" }],
        followUps: [
          { label: "Request time off", sendAs: "I'd like to request time off next Friday" },
          { label: "See holiday calendar", sendAs: "Show me the holiday calendar" },
        ],
      },
      { role: "user", content: "I'd like to request time off next Friday" },
      {
        role: "assistant",
        typingMs: 700,
        content:
          "Submitted PTO for **Friday, May 1** to your manager **Jordan** for approval. You'll have **17 days** remaining after this is approved.",
      },
    ],
    templateSlug: "internal-kb-agent",
  },
  {
    slug: "marketing-faq-agent",
    title: "Marketing & FAQ Agent",
    tagline: "Qualify leads 24/7.",
    description:
      "Answer pricing, security, and product questions on your site — then book a call the moment the buyer is ready.",
    icon: "MessageSquareText",
    accentLabel: "Growth",
    highlights: [
      "Answers grounded in your marketing site & security pages",
      "Detects buying intent and offers a demo",
      "Hands warm leads straight to your CRM",
    ],
    embed: { agentId: "demo-marketing-faq" },
    suggestedPrompts: [
      "Does this work with Salesforce?",
      "How does your pricing work?",
      "Are you SOC 2 compliant?",
    ],
    script: [
      { role: "user", content: "Does this work with Salesforce?" },
      {
        role: "assistant",
        typingMs: 900,
        content:
          "Yes — Zephlo runs client-side, so it works with any app your users already log into, including **Salesforce**. No API integration, no credentials to store on our side.",
        sources: [
          { title: "How tools run in the browser", url: "#" },
          { title: "Security overview", url: "#" },
        ],
        followUps: [
          { label: "Book a 15-min demo", sendAs: "Can we book a 15-minute demo?" },
          { label: "Security details", sendAs: "Tell me more about security" },
        ],
      },
      { role: "user", content: "Can we book a 15-minute demo?" },
      {
        role: "assistant",
        typingMs: 700,
        content:
          "I have slots this **Thursday 10am** or **Friday 2pm** PT. Which works? I'll send a calendar invite and loop in our solutions team.",
        followUps: [
          { label: "Thursday 10am works", sendAs: "Thursday 10am works for me" },
          { label: "Friday 2pm works", sendAs: "Friday 2pm works for me" },
        ],
      },
    ],
    templateSlug: "marketing-faq-agent",
  },
];

export function getExample(slug: string): Example | undefined {
  return examples.find((e) => e.slug === slug);
}

/**
 * Dashboard agent-creation URL with a template hint. The dashboard route
 * `/agents/new` already exists; the template query param is a non-breaking
 * hint the dashboard can honor later to pre-fill the agent's purpose.
 */
export function templateUrl(slug: string): string {
  return `/agents/new?template=${encodeURIComponent(slug)}`;
}
