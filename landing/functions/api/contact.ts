// POST /api/contact — the contact form on the solution pages.
import { handleLead, type LeadContext } from "../_lead";

export const onRequestPost = (ctx: LeadContext) =>
  handleLead(ctx, "contact-success", "contact");
