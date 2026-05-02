# Zephlo.ai — Main Landing Page Prompt

## Context
Zephlo is an AI agent platform that lets businesses deploy conversational AI agents that can actually *do things* on any web interface. The key differentiator: agents execute tools directly in the browser (client-side), so there's no OAuth, no API integrations, no backend complexity. The agent operates the UI just like a human would.

**Target audience:** Technical founders, product leaders, CTOs, and developers looking for AI automation that doesn't require months of API integration work.

**Tone:** Premium, confident, modern. Think Vercel meets Linear — clean, developer-friendly, sophisticated but not cold.

## Tech Stack
- Next.js 16.2.2 (App Router) or Astro
- Tailwind CSS
- Dark theme with the Zephlo gradient
- Smooth animations (Framer Motion)
- Mobile responsive
- Fast — aim for 95+ Lighthouse

## Page Structure

### 1. Nav Bar
- Logo: Zephlo mark + wordmark
- Links: Use Cases, How It Works, Docs, Pricing
- CTA: "Get Started" → waitlist or demo booking

### 2. Hero Section
**Headline:** "AI agents that actually do things"

**Subheadline:** "Deploy conversational AI that operates any web interface. No APIs. No OAuth. No integration headaches. Just describe what you want done."

**CTA:** "Get Early Access" (primary) + "Watch Demo" (secondary)

**Visual:** Abstract animation showing the Zephlo agent interacting with a generic web UI — clicking, typing, navigating. Or a split view: user chatting on left, UI being operated on right.

### 3. Problem Section
**Headline:** "AI promises automation. Integrations deliver headaches."

Three pain points:
- **"Connect your app"** → Weeks of API work, OAuth flows, maintenance burden
- **"We'll scrape your site"** → Brittle, breaks on UI changes, security concerns  
- **"Just use our API"** → Your users still have to click through your UI anyway

**Punchline:** "What if the AI could just... use the interface?"

### 4. Solution Section — The Zephlo Approach
**Headline:** "Client-side AI. Zero integration."

"Zephlo agents run tools directly in the user's browser — clicking buttons, filling forms, navigating pages. The same way a human would, but instant."

Three pillars:
1. **No API required** — Works with any web app out of the box
2. **No OAuth nightmare** — Users stay in their own session
3. **No maintenance burden** — UI changes? The agent adapts.

Visual: Diagram showing traditional approach (API + OAuth + backend) vs Zephlo approach (browser-native)

### 5. Use Cases Section
**Headline:** "One platform. Endless possibilities."

Grid of use case cards (link to dedicated pages):

**SaaS Onboarding**
"Turn 15-step setup wizards into one conversation. Users tell the agent what they want, it configures everything."
→ Learn more

**Customer Support + Actions**
"Go beyond answering questions. Your support agent can actually resolve issues — cancel subscriptions, update settings, process refunds."
→ Learn more

**Internal Tools**
"Let employees chat to get things done. 'Add this vendor to the system' → done. No training required."
→ Learn more

**E-commerce**
"'Find me a blue dress under $50 in size M' → agent searches, filters, adds to cart. Shopping via conversation."
→ Learn more

**Lead Qualification**
"Capture and qualify leads through natural conversation while the agent fills your CRM in real-time."
→ Coming soon

### 6. How It Works
**Headline:** "Live in minutes, not months"

Three steps:

**1. Define your tools**
"Describe what actions your agent can take — in plain English. 'Fill the signup form', 'Navigate to settings', 'Toggle dark mode'. No code required."

**2. Add the widget**
"One script tag. Zephlo appears as a chat interface on your site, ready to help users."

**3. Users chat, Zephlo does**
"Your users describe what they want. Zephlo handles the clicking, typing, and navigating — all in their browser, in real-time."

Code snippet preview:
```html
<script src="https://unpkg.com/zephlo" data-key="your-key"></script>
```

### 7. Why Client-Side Matters
**Headline:** "The browser is the integration"

Comparison table:

| | Traditional AI Agents | Zephlo |
|---|---|---|
| Integration time | Weeks/months | Minutes |
| API access required | Yes | No |
| OAuth flows | Complex | None |
| Maintenance | Constant | Minimal |
| Works with any web app | No | Yes |
| User stays in their session | No | Yes |

### 8. Security Section
**Headline:** "Your data never leaves the browser"

- Tools execute in the user's own browser session
- No credentials shared with Zephlo servers
- No screen scraping or data exfiltration  
- SOC 2 compliant (or "Security audit in progress" if not yet)
- You control what the agent can and can't do

### 9. Social Proof (placeholder)
"Trusted by forward-thinking teams"
- Placeholder for logos
- Or: "Join 100+ companies on the waitlist"
- Testimonial slots for later

### 10. Pricing Section
**Headline:** "Start free. Scale as you grow."

Simple tiers or "We're in early access — talk to us about pricing"

If showing tiers:
- **Starter** — Free, limited conversations, 1 agent
- **Pro** — $X/mo, unlimited conversations, analytics, priority support
- **Enterprise** — Custom, SSO, dedicated support, SLA

### 11. CTA Section
**Headline:** "Ready to stop integrating and start automating?"

**Subheadline:** "Get early access to Zephlo. Deploy your first AI agent in minutes."

Email capture + "Join Waitlist" button

### 12. Footer
- Zephlo logo
- Product: Use Cases, How It Works, Docs, Pricing
- Company: About, Blog, Careers
- Legal: Privacy, Terms
- Social: Twitter/X, LinkedIn, GitHub
- "Built with ☕ in Kenya 🇰🇪"
- © 2026 Zephlo

## Design Notes
- Use the logo's teal-to-blue gradient as accent throughout
- Dark background (#0A0A0F or similar), light text
- Subtle grid or dot pattern background (like Vercel)
- Animations should feel smooth and premium, not flashy
- Code snippets in a styled terminal/code block component
- Icons: Lucide or Heroicons, consistent stroke width

## Technical Notes
- Email signup should work (Supabase, Resend, or ConvertKit)
- Add analytics (Plausible, PostHog, or Vercel Analytics)
- Meta tags: "Zephlo — AI Agents That Actually Do Things"
- OG image with logo and tagline
- Lighthouse target: 95+ performance
