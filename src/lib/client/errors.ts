type ApiErrorBody = {
  error?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
};

/**
 * Turns an apiError()-shaped response body into a readable message that
 * names the actual problem (e.g. "Số điện thoại Việt Nam không hợp lệ")
 * instead of just the generic top-level "Dữ liệu không hợp lệ" string.
 */
export function extractApiError(body: unknown, fallback: string): string {
  const b = (body ?? {}) as ApiErrorBody;
  const messages = new Set<string>();
  if (b.details?.fieldErrors) {
    for (const list of Object.values(b.details.fieldErrors)) {
      for (const message of list) messages.add(message);
    }
  }
  if (b.details?.formErrors) {
    for (const message of b.details.formErrors) messages.add(message);
  }
  if (messages.size) {
    const detail = [...messages].join("; ");
    return b.error && b.error !== detail ? `${b.error}: ${detail}` : detail;
  }
  return b.error || fallback;
}
