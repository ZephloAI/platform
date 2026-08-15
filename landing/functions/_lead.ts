// Shared handler for both lead forms. On the static Cloudflare Pages build
// this replaces the Go `lead` handler — same contract, so the front end is
// unchanged: htmx gets the success markup back, a no-JS post gets /thanks.
//
// Files starting with `_` are not routed by Pages, so this is a plain module.

export interface Env {
  // Bound automatically by Pages — lets us read the exported success partials.
  ASSETS: { fetch: (req: Request | string) => Promise<Response> };
  // Set these in the Pages dashboard (Settings → Environment variables).
  RESEND_API_KEY?: string;
  /** Who gets the lead. Comma-separated for more than one recipient. */
  LEAD_TO_EMAIL?: string;
  LEAD_FROM_EMAIL?: string;
}

export interface LeadContext {
  request: Request;
  env: Env;
}

interface Lead {
  form: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
}

/** Read a form field as a trimmed string; missing fields become "". */
function field(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

/**
 * Email the lead to the sales inbox. Never throws: a mail outage must not
 * cost us the submission or show the visitor an error, so failures are
 * logged (visible in the Pages function logs) and swallowed.
 */
async function sendLeadEmail(env: Env, lead: Lead): Promise<void> {
  // One address or several — "a@x.com, b@y.com" all get their own copy.
  const to = (env.LEAD_TO_EMAIL || "sales@zephlo.ai")
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);
  const from = env.LEAD_FROM_EMAIL || "Zephlo Leads <leads@zephlo.ai>";

  if (!env.RESEND_API_KEY) {
    console.log("lead received (no RESEND_API_KEY set, not emailed)", { to, lead });
    return;
  }

  const lines = [
    `Form:    ${lead.form}`,
    `Name:    ${lead.name}`,
    `Email:   ${lead.email}`,
    `Company: ${lead.company || "—"}`,
    `Phone:   ${lead.phone || "—"}`,
    "",
    lead.message || "(no message)",
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `New ${lead.form} lead — ${lead.name}`,
        text: lines,
        // Replying in the inbox goes straight back to the lead.
        reply_to: lead.email,
      }),
    });
    if (!res.ok) {
      console.error("lead email failed", res.status, await res.text(), lead);
    }
  } catch (err) {
    console.error("lead email threw", err, lead);
  }
}

/**
 * @param partial  name of the exported success fragment, e.g. "pricing-success"
 * @param formName label used in the email subject and logs
 */
export async function handleLead(
  ctx: LeadContext,
  partial: string,
  formName: string,
): Promise<Response> {
  const { request, env } = ctx;

  const form = await request.formData();
  const lead: Lead = {
    form: formName,
    name: field(form, "name"),
    email: field(form, "email"),
    company: field(form, "company"),
    phone: field(form, "country_code") + field(form, "phone"),
    message: field(form, "message"),
  };

  // Same validation the Go handler applied.
  if (!lead.name || !lead.email.includes("@")) {
    return new Response("name and a valid email are required", { status: 422 });
  }

  await sendLeadEmail(env, lead);

  // htmx swaps this straight into the page, replacing the form.
  if (request.headers.get("HX-Request") === "true") {
    const asset = await env.ASSETS.fetch(
      new URL(`/partials/${partial}.html`, request.url).toString(),
    );
    return new Response(asset.body, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // No JS: send them to a real page, since the pre-rendered HTML can't
  // re-render itself the way the Go server's ?sent=1 fallback did.
  return Response.redirect(new URL("/thanks", request.url).toString(), 303);
}
