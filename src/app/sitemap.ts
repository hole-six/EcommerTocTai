import type { MetadataRoute } from "next";
import { connectDb } from "@/lib/server/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { SITE_URL, canonical } from "@/lib/seo.config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: canonical("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: canonical("/shop/all"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: canonical("/pages/hair-form-assessment"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: canonical("/chinh-sach-bao-mat"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: canonical("/dieu-khoan-dich-vu"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: canonical("/chinh-sach-doi-tra"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: canonical("/chinh-sach-giao-hang"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: canonical("/kham-pha/nguyen-nhan-hoi-dau"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: canonical("/kham-pha/cach-chua-hoi-dau-chu-m"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: canonical("/kham-pha/giai-phap-moc-toc-nhanh"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  try {
    await connectDb();
    const [categories, products] = await Promise.all([
      Category.find({ isActive: true }).select("slug updatedAt").lean(),
      Product.find({ status: "active" }).select("slug updatedAt").lean(),
    ]);

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${SITE_URL}/shop/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${SITE_URL}/san-pham/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}

