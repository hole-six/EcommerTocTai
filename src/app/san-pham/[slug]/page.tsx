import type { Metadata } from "next";
import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/server/db";
import { CatalogProduct } from "@/models/CatalogProduct";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";
import { ProductDetailClient } from "./ProductDetailClient";

const siteUrl = "https://moctoc.vn";

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
    alternates: { canonical: `${siteUrl}/san-pham/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `${siteUrl}/san-pham/${product.slug}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
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

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description || undefined,
    image: (product.images ?? []).map((image: string) => (image.startsWith("http") ? image : `${siteUrl}${image}`)),
    sku: product.sku,
    category: product.category?.name,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/san-pham/${product.slug}`,
      priceCurrency: "VND",
      price: product.salePrice ?? product.price,
      availability:
        product.inventory > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(reviews.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: reviews.length,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient slug={slug} />
    </>
  );
}
