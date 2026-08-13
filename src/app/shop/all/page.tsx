import { CatalogPage } from "@/components/catalog/CatalogPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tất cả sản phẩm",
  description: "Khám phá tất cả các sản phẩm chăm sóc tóc, serum kích mọc tóc, dầu gội và thực phẩm bổ sung từ CareWise.",
};

export default function AllProductsPage() { return <CatalogPage />; }
