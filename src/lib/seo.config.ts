/**
 * Centralized SEO configuration & helpers.
 *
 * Every page that needs SEO metadata should import from here instead of
 * hardcoding siteUrl / siteName / etc. This keeps values consistent and
 * makes future domain changes a single-line fix.
 */

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const SITE_URL = "https://thuocmoctocchinhhang.com";
export const SITE_NAME = "CareWise";
export const DEFAULT_DESCRIPTION =
  "CareWise - Hệ thống phân phối thuốc mọc tóc chính hãng, giải pháp trị hói đầu và chăm sóc da đầu chuẩn y khoa. Giao hàng toàn quốc, tư vấn chuyên sâu.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/toc-tai-hero.png`;
export const DEFAULT_LOCALE = "vi_VN";
export const PUBLISHER = {
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/images/logocarewise-trimmed.png`,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Build a full canonical URL from a relative path. */
export function canonical(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}

/** Ensure an image URL is absolute. */
export function absImage(src: string): string {
  if (!src) return DEFAULT_OG_IMAGE;
  return src.startsWith("http") ? src : `${SITE_URL}${src}`;
}

/* ------------------------------------------------------------------ */
/*  Metadata builders (Next.js Metadata API)                           */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";

interface OgOverrides {
  title: string;
  description: string;
  url: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
}

/** Build a full openGraph + twitter metadata block. */
export function buildSocialMeta(o: OgOverrides): Pick<Metadata, "openGraph" | "twitter"> {
  const image = o.image ? absImage(o.image) : DEFAULT_OG_IMAGE;
  return {
    openGraph: {
      title: o.title,
      description: o.description,
      url: o.url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: o.imageAlt || o.title }],
      locale: DEFAULT_LOCALE,
      type: o.type ?? "website",
    },
    twitter: {
      card: "summary_large_image",
      title: o.title,
      description: o.description,
      images: [image],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  JSON-LD builders (structured data)                                 */
/* ------------------------------------------------------------------ */

interface BreadcrumbItem {
  name: string;
  url: string;
}

/** BreadcrumbList — helps Google show breadcrumb trail in SERPs. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface ArticleInput {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  keywords?: string[];
}

/** Article / BlogPosting — for blog/content pages. */
export function articleJsonLd(input: ArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: input.url,
    image: input.image ? absImage(input.image) : DEFAULT_OG_IMAGE,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: {
      "@type": "Organization",
      name: PUBLISHER.name,
      url: PUBLISHER.url,
    },
    publisher: {
      "@type": "Organization",
      name: PUBLISHER.name,
      url: PUBLISHER.url,
      logo: {
        "@type": "ImageObject",
        url: PUBLISHER.logo,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
    },
    ...(input.keywords?.length ? { keywords: input.keywords.join(", ") } : {}),
  };
}

interface FAQItem {
  question: string;
  answer: string;
}

/** FAQPage — enables FAQ rich snippets on Google. */
export function faqJsonLd(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

interface ProductInput {
  name: string;
  description?: string;
  images: string[];
  sku?: string;
  category?: string;
  slug: string;
  price: number;
  salePrice?: number;
  inventory: number;
  avgRating?: number;
  reviewCount?: number;
  brand?: string;
}

/** Product — for product detail pages. */
export function productJsonLd(input: ProductInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description || undefined,
    image: input.images.map((img) => absImage(img)),
    sku: input.sku,
    category: input.category,
    brand: {
      "@type": "Brand",
      name: input.brand || SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: canonical(`/san-pham/${input.slug}`),
      priceCurrency: "VND",
      price: input.salePrice ?? input.price,
      ...(input.salePrice
        ? {
            priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
            discount: Math.round(((input.price - input.salePrice) / input.price) * 100),
          }
        : {}),
      availability:
        input.inventory > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        alternateName: "Thuốc mọc tóc chính hãng CareWise",
        url: SITE_URL,
      },
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(input.reviewCount && input.avgRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.avgRating.toFixed(1),
            reviewCount: input.reviewCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };
}

/** CollectionPage — for category / collection pages. */
export function collectionJsonLd(name: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: "Thuốc mọc tóc chính hãng CareWise",
      url: SITE_URL,
    },
  };
}

/** Render a JSON-LD script tag (use in JSX). */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}
