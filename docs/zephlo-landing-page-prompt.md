# Zephlo.ai Landing Page — Build Prompt

## Context
Zephlo is an AI agent SaaS that lets businesses replace complex onboarding flows with a chat interface. Instead of users clicking through 15 setup screens, they just tell the agent what they want. The agent operates tools directly in the browser (client-side), so there's no OAuth, no API integrations, no backend complexity for the customer.

**Target audience:** SaaS founders, product leaders, and growth teams who are losing users during onboarding.

**Tone:** Modern, confident, slightly playful. Think Linear or Vercel's website — clean, premium, developer-friendly but not intimidating.

## Tech Stack
Single-page landing built with:
- Next.js or plain HTML/Tailwind (builder's choice)
- Dark theme with accent color (suggest electric blue or purple)
- Smooth scroll, minimal animations
- Mobile responsive
- Fast — no heavy frameworks

## Page Structure

### 1. Nav Bar
- Logo: "Zephlo" (text logo for now)
- Links: How it Works, Pricing, Docs (placeholder)
- CTA button: "Get Early Access" → scrolls to signup form

### 2. Hero Section
**Headline:** "Your users don't want a tour. They want to be done."
**Subheadline:** "Zephlo replaces your onboarding flow with an AI agent that sets everything up through chat. No more dropoff. No more 15-step wizards."
**CTA:** "Get Early Access" button (primary) + "See how it works" (secondary, scrolls down)
**Visual:** Split screen or embedded demo showing: left side = traditional onboarding wizard with many steps, right side = simple chat where user says "set up my workspace" and the agent does it. Can be a mockup/illustration or animated.

### 3. Problem Section
**Headline:** "Onboarding is where you lose them"
Three cards/stats:
- "73% of users never complete onboarding" (industry stat)
- "Average SaaS onboarding has 12+ steps"  
- "Every extra click costs you conversions"
Brief paragraph: "You built an amazing product. But your users never see it because they bounce during setup. Tooltips and product tours aren't the answer — they're just more noise."

### 4. Solution Section — "How Flunkie Works"
Three steps with icons/illustrations:

**Step 1: Define your tools**
"Tell Flunkie what actions your onboarding needs — fill forms, toggle settings, navigate pages. No code required. Just describe what each tool does."

**Step 2: Drop in the widget**
"Add one script tag to your site. Zephlo's chat widget appears for new users. It knows your product and your onboarding flow."

**Step 3: Users chat, Zephlo does the rest**
"New user says 'set up my workspace for a 5-person team' and Zephlo handles it — clicking buttons, filling forms, configuring settings. All client-side, all in real-time."

### 5. Key Differentiator Section
**Headline:** "No APIs. No OAuth. No backend headaches."
"Other AI agents scrape your site or need API access. Zephlo runs tools directly in the user's browser — the same way a human would click through your UI. That means:"
- Zero integration complexity
- Works with any web app instantly
- No security risks from API token sharing
- Your existing UI is the integration

### 6. Use Cases / Benefits
Cards or alternating left-right layout:

**Faster activation**
"Users go from signup to 'aha moment' in one conversation instead of 15 clicks."

**Higher conversion**
"Stop losing trial users to onboarding friction. Flunkie gets them set up before they lose interest."

**Less support load**
"When onboarding is conversational, users ask Zephlo — not your support team."

**Works with your existing product**
"No rebuilding your onboarding. Zephlo operates your current UI. Ship in days, not months."

### 7. Social Proof (placeholder)
"Trusted by forward-thinking SaaS teams" with placeholder logos or "Join 50+ companies on the waitlist" (adjust number as needed). This section can be hidden initially and shown once there's real proof.

### 8. Pricing Section (keep simple)
**Headline:** "Simple pricing. Premium product."
Show a single plan or "Starting at $X/mo" with:
- Unlimited conversations
- Up to X tools/workflows
- Analytics dashboard
- Priority support
CTA: "Get Early Access" or "Talk to us"

Or alternatively: "We're in early access. Book a call to discuss pricing." — This might be better for day one since pricing isn't locked in.

### 9. FAQ Section
Collapsible FAQ:
- "How does client-side tool execution work?" → Brief explanation of browser-based automation
- "Do I need to change my existing product?" → No, Flunkie works with your current UI
- "How long does setup take?" → Most teams are live in under a day
- "Is it secure?" → Tools run in the user's own browser session. No credentials are shared or stored.
- "What if the AI makes a mistake?" → Flunkie confirms critical actions before executing. You define guardrails.

### 10. Final CTA Section
**Headline:** "Stop losing users at the front door"
**Subheadline:** "Get early access to Zephlo and turn your onboarding into a conversation."
Email input + "Join the waitlist" button
Small text: "No credit card required. We'll reach out within 24 hours."

### 11. Footer
- Zephlo logo
- Links: Privacy, Terms, Twitter/X, LinkedIn
- "Built in Kenya 🇰🇪" (optional but cool)
- © 2026 Zephlo

## Important Notes
- The email signup should actually work — connect to a simple backend, Supabase, or even just a Google Form/Formspree endpoint
- Add meta tags for SEO: title "Zephlo — AI-Powered SaaS Onboarding", description, og:image
- Include a subtle animation or interactive element in the hero to make it feel premium
- Keep total page load under 2 seconds
- Add analytics (Plausible, PostHog, or similar)
