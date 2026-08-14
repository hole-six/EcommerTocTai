import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/api", "/checkout", "/checkout-v2", "/account", "/login", "/register", "/forgot-password", "/reset-password", "/hair-form", "/home", "/cua-hang"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/checkout", "/checkout-v2", "/account", "/login", "/register", "/forgot-password", "/reset-password", "/hair-form", "/home", "/cua-hang"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

