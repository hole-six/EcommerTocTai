"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import panel from "@/components/admin/admin-panel.module.css";

export default function NewProductPage() {
  return (
    <AdminShell breadcrumb="Sản phẩm mới">
      <div className={panel.header}>
        <div>
          <p>COMMERCE / SẢN PHẨM / MỚI</p>
          <h1>Tạo sản phẩm mới</h1>
        </div>
      </div>
      <ProductForm />
    </AdminShell>
  );
}
