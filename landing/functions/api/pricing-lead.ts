// POST /api/pricing-lead — the pricing form on the home page.
import { handleLead, type LeadContext } from "../_lead";

export const onRequestPost = (ctx: LeadContext) =>
  handleLead(ctx, "pricing-success", "pricing");
