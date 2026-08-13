import { CatalogPage } from "@/components/catalog/CatalogPage";
import { Metadata } from "next";
import { connectDb } from "@/lib/server/db";
import { Category } from "@/models/Category";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  await connectDb();
  const category = await Category.findOne({ slug }).lean();
  
  if (!category) return { title: "Danh mục sản phẩm" };
  
  return {
    title: category.name,
    description: `Mua sắm các sản phẩm thuộc danh mục ${category.name} với mức giá ưu đãi tại CareWise.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) { 
  const { category } = await params; 
  return <CatalogPage initialCategory={category} />; 
}
