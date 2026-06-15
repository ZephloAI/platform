// Small helpers shared by every registrar so individual tool bodies stay
// minimal. The only logic allowed in a tool is parameter marshalling and a
// hook call — these helpers cover the rest (response shaping, optional
// navigation, error formatting).

/** Render a successful tool result as a string for the LLM.
 *  Objects are JSON-stringified, primitives are toString'd. */
export function ok(payload: unknown): string {
  if (typeof payload === 'string') return payload;
  return JSON.stringify(payload, null, 2);
}

/** Render a failure as a string the LLM can reason about. */
export function err(message: string, detail?: unknown): string {
  const body: Record<string, unknown> = { error: message };
  if (detail !== undefined) body.detail = detail;
  return JSON.stringify(body);
}

/** Extract a useful error message from anything thrown by axios / a hook. */
export function describeError(e: unknown): string {
  if (!e) return 'Unknown error';
  const anyE = e as { response?: { data?: { detail?: string; message?: string } }; message?: string };
  return (
    anyE.response?.data?.detail ||
    anyE.response?.data?.message ||
    anyE.message ||
    String(e)
  );
}
