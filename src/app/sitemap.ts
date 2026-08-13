import type { MetadataRoute } from "next";
import { connectDb } from "@/lib/server/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

const siteUrl = "https://thuocmoctocchinhhang.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/shop/all`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/pages/hair-form-assessment`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/chinh-sach-bao-mat`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/dieu-khoan-dich-vu`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/chinh-sach-doi-tra`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/chinh-sach-giao-hang`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/kham-pha/nguyen-nhan-hoi-dau`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/kham-pha/cach-chua-hoi-dau-chu-m`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/kham-pha/giai-phap-moc-toc-nhanh`, changeFrequency: "monthly", priority: 0.8 },
  ];

  try {
    await connectDb();
    const [categories, products] = await Promise.all([
      Category.find({ isActive: true }).select("slug updatedAt").lean(),
      Product.find({ status: "active" }).select("slug updatedAt").lean(),
    ]);

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${siteUrl}/shop/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${siteUrl}/san-pham/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
