// Central place for outbound product URLs used by CTAs across the marketing site.
// Resolved at build time from NEXT_PUBLIC_* env so the same image can be pointed at
// staging/production dashboards without code changes.

const dashboardOrigin =
  process.env.NEXT_PUBLIC_DASHBOARD_URL?.replace(/\/$/, "") ||
  "https://app.zephlo.ai";

const docsOrigin =
  process.env.NEXT_PUBLIC_DOCS_URL?.replace(/\/$/, "") || "https://docs.zephlo.ai";

const salesEmail = process.env.NEXT_PUBLIC_SALES_EMAIL || "sales@zephlo.ai";

export const links = {
  signUp: `${dashboardOrigin}/register`,
  signIn: `${dashboardOrigin}/login`,
  dashboard: `${dashboardOrigin}/dashboard`,
  docs: docsOrigin,
  sales: `mailto:${salesEmail}?subject=Talk%20to%20sales%20about%20Zephlo`,
  salesEmail,
};

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://zephlo.ai";
