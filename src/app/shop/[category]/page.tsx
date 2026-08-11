import { CatalogPage } from "@/components/catalog/CatalogPage";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) { const { category } = await params; return <CatalogPage initialCategory={category} />; }
