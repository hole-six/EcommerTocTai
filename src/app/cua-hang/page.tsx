import { CatalogPage } from "@/components/catalog/CatalogPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cửa hàng | CareWise",
  description: "Mua sắm các sản phẩm chăm sóc tóc, serum kích mọc tóc, dầu gội và thực phẩm bổ sung chính hãng từ CareWise.",
};

export default function ShopPage() { return <CatalogPage />; }
