"use client";

import { use, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm, type ProductInitial } from "@/components/admin/ProductForm";
import panel from "@/components/admin/admin-panel.module.css";

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductInitial | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/commerce/products/${id}`)
      .then((response) => response.json())
      .then((body) => (body.data ? setProduct(body.data) : setNotFound(true)));
  }, [id]);

  return (
    <AdminShell breadcrumb="Sửa sản phẩm">
      <div className={panel.header}>
        <div>
          <p>COMMERCE / SẢN PHẨM / SỬA</p>
          <h1>{product?.name ?? "Sửa sản phẩm"}</h1>
        </div>
      </div>
      {notFound && <p className={panel.empty}>Không tìm thấy sản phẩm.</p>}
      {product && <ProductForm initial={product} />}
    </AdminShell>
  );
}
