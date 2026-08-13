/**
 * Public site origin, used to build absolute callback URLs (payment gateway
 * redirects, etc). Deriving this from the incoming request is unreliable
 * behind the nginx reverse proxy (it resolved to "http://localhost:3000" in
 * production), so it's a fixed value instead — override with SITE_URL if the
 * domain changes again.
 */
export const SITE_URL = (process.env.SITE_URL?.trim() || "https://thuocmoctocchinhhang.com").replace(/\/$/, "");
