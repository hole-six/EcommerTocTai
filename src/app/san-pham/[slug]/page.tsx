import type { Metadata } from "next";
import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/server/db";
import { CatalogProduct } from "@/models/CatalogProduct";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";
import { ProductDetailClient } from "./ProductDetailClient";
import { SITE_URL, canonical, absImage, buildSocialMeta, breadcrumbJsonLd, productJsonLd } from "@/lib/seo.config";

async function getProduct(slug: string) {
  await connectDb();
  const product = await Product.findOne({ slug, status: "active" })
    .populate("category", "name slug")
    .lean();
  if (product) return product;

  const catalogProduct = await CatalogProduct.findOne({ slug, status: "active" }).lean();
  if (!catalogProduct) return null;
  const description =
    (catalogProduct.blocks as Array<{ type?: string; data?: { paragraphs?: string[] } }> | undefined)
      ?.find((block) => block.type === "richText")
      ?.data?.paragraphs?.join("\n") ?? "";
  return {
    _id: catalogProduct.id,
    name: catalogProduct.name,
    slug: catalogProduct.slug,
    sku: catalogProduct.sku,
    shortDescription: catalogProduct.shortDescription,
    description,
    images: catalogProduct.images,
    price: catalogProduct.compareAtPrice ?? catalogProduct.price,
    salePrice: catalogProduct.compareAtPrice ? catalogProduct.price : undefined,
    inventory: catalogProduct.inventory,
    category: { name: catalogProduct.category },
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Sản phẩm không tồn tại" };

  const description = (product.shortDescription || product.description || "").slice(0, 160);
  const image = product.images?.[0];

  return {
    title: product.name,
    description,
    alternates: { canonical: canonical(`/san-pham/${product.slug}`) },
    ...buildSocialMeta({
      title: product.name,
      description,
      url: canonical(`/san-pham/${product.slug}`),
      image: image ? absImage(image) : undefined,
    }),
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const reviews = isValidObjectId(product._id)
    ? await Review.find({ product: product._id, isPublished: true }).select("rating").lean()
    : [];
  const avgRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  const productLd = productJsonLd({
    name: product.name,
    description: product.shortDescription || product.description || undefined,
    images: product.images ?? [],
    sku: product.sku,
    category: product.category?.name,
    slug: product.slug,
    price: product.price,
    salePrice: product.salePrice,
    inventory: product.inventory,
    avgRating: avgRating || undefined,
    reviewCount: reviews.length || undefined,
  });

  const bcLd = breadcrumbJsonLd([
    { name: "Trang chủ", url: SITE_URL },
    { name: product.category?.name || "Sản phẩm", url: canonical(`/shop/${product.category?.slug || "all"}`) },
    { name: product.name, url: canonical(`/san-pham/${product.slug}`) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bcLd) }}
      />
      <ProductDetailClient slug={slug} />
    </>
  );
}
