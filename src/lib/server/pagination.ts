export const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export function parsePagination(url: URL, defaultLimit = DEFAULT_PAGE_SIZE) {
  const page = Math.max(1, Math.trunc(Number(url.searchParams.get("page"))) || 1);
  const requestedLimit = Math.trunc(Number(url.searchParams.get("limit"))) || defaultLimit;
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginationMeta(page: number, limit: number, total: number) {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
