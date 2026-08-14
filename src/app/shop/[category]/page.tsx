import { CatalogPage } from "@/components/catalog/CatalogPage";
import { Metadata } from "next";
import { connectDb } from "@/lib/server/db";
import { Category } from "@/models/Category";
import { canonical, buildSocialMeta, SITE_URL, breadcrumbJsonLd, collectionJsonLd } from "@/lib/seo.config";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  await connectDb();
  const category = await Category.findOne({ slug }).lean();
  
  if (!category) return { title: "Danh mục sản phẩm" };

  const description = `Mua sắm các sản phẩm thuộc danh mục ${category.name} với mức giá ưu đãi tại CareWise.`;
  
  return {
    title: category.name,
    description,
    keywords: [category.name, "mua sắm", "chăm sóc tóc", "CareWise"],
    alternates: { canonical: canonical(`/shop/${slug}`) },
    ...buildSocialMeta({ title: category.name, description, url: canonical(`/shop/${slug}`) }),
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) { 
  const { category: slug } = await params;
  await connectDb();
  const category = await Category.findOne({ slug }).lean();
  const categoryName = category?.name || "Danh mục sản phẩm";
  const categoryDesc = `Mua sắm các sản phẩm thuộc danh mục ${categoryName} với mức giá ưu đãi tại CareWise.`;

  const bcLd = breadcrumbJsonLd([
    { name: "Trang chủ", url: SITE_URL },
    { name: "Cửa hàng", url: canonical("/shop/all") },
    { name: categoryName, url: canonical(`/shop/${slug}`) },
  ]);
  const collLd = collectionJsonLd(categoryName, categoryDesc, canonical(`/shop/${slug}`));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collLd) }} />
      <CatalogPage initialCategory={slug} />
    </>
  );
}
