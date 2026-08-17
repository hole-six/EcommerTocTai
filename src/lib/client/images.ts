const ABSOLUTE_IMAGE_PATTERN = /^(https?:|data:|blob:)/i;

export function normalizeImageSrc(src?: string | null) {
  const value = String(src ?? "").trim();
  if (!value) return "";
  if (ABSOLUTE_IMAGE_PATTERN.test(value)) return value;

  const normalized = value.replace(/\\/g, "/");
  if (normalized.startsWith("/")) return normalized;
  if (
    normalized.startsWith("uploads/") ||
    normalized.startsWith("images/") ||
    normalized.startsWith("sites/")
  ) {
    return `/${normalized}`;
  }

  return normalized;
}

export function shouldRenderUnoptimizedImage(src?: string | null) {
  const normalized = normalizeImageSrc(src);
  return (
    normalized.startsWith("/uploads/") ||
    ABSOLUTE_IMAGE_PATTERN.test(normalized) ||
    /\.svg(?:[?#]|$)/i.test(normalized)
  );
}
