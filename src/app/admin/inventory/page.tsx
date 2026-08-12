"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import panel from "@/components/admin/admin-panel.module.css";

type Product = { _id: string; name: string; sku: string; inventory: number; reservedInventory?: number; status: "draft" | "active" | "archived"; images: string[] };

const LOW_STOCK = 10;

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/commerce/products?status=all").then((response) => response.json()).then((body) => setProducts(body.data ?? [])).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function save(product: Product) {
    const draft = drafts[product._id];
    if (draft === undefined) return;
    const inventory = Number(draft);
    const reserved = product.reservedInventory ?? 0;
    if (Number.isNaN(inventory) || inventory < reserved) {
      setMessage(`Tồn kho không thể thấp hơn ${reserved} sản phẩm đang được giữ cho đơn hàng.`);
      return;
    }
    setSavingId(product._id);
    setMessage("");
    try {
      const response = await fetch(`/api/commerce/products/${product._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inventory }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Cập nhật tồn kho thất bại");
      setProducts((current) => current.map((item) => (item._id === product._id ? body.data : item)));
      setDrafts((current) => { const next = { ...current }; delete next[product._id]; return next; });
      setMessage(`Đã cập nhật tồn kho ${product.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cập nhật tồn kho thất bại");
    } finally {
      setSavingId(null);
    }
  }

  const lowStock = products.filter((product) => product.status === "active" && product.inventory < LOW_STOCK);

  return (
    <AdminShell breadcrumb="Kho hàng">
      <div className={panel.header}>
        <div>
          <p>COMMERCE / KHO HÀNG</p>
          <h1>Quản lý tồn kho</h1>
        </div>
      </div>

      <div className={panel.metrics}>
        <article><span>TỔNG SỐ SẢN PHẨM</span><strong>{products.length}</strong></article>
        <article><span>SẮP HẾT HÀNG (&lt; {LOW_STOCK})</span><strong style={{ color: lowStock.length ? "#c1493f" : undefined }}>{lowStock.length}</strong></article>
      </div>

      <div className={panel.panel}>
        <div className={panel.tableWrap}>
          <table>
            <thead><tr><th></th><th>Sản phẩm</th><th>SKU</th><th>Tồn kho</th><th>Đang giữ</th><th>Có thể bán</th><th>Cập nhật</th><th></th></tr></thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>{product.images[0] && <img src={product.images[0]} alt="" width={32} height={32} style={{ borderRadius: 6, objectFit: "cover" }} />}</td>
                  <td><b>{product.name}</b></td>
                  <td>{product.sku}</td>
                  <td>
                    <span className={`${panel.status} ${product.inventory < LOW_STOCK ? panel.red : panel.green}`}>{product.inventory} sản phẩm</span>
                  </td>
                  <td>{product.reservedInventory ?? 0}</td>
                  <td><b>{Math.max(0, product.inventory - (product.reservedInventory ?? 0))}</b></td>
                  <td>
                    <input type="number" min={product.reservedInventory ?? 0} placeholder={String(product.inventory)} value={drafts[product._id] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [product._id]: event.target.value }))} style={{ width: 90 }} />
                  </td>
                  <td>
                    <button className={panel.saveButton} disabled={savingId === product._id || drafts[product._id] === undefined} onClick={() => save(product)}>{savingId === product._id ? "Đang lưu…" : "Lưu"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && products.length === 0 && <p className={panel.empty}>Chưa có sản phẩm nào.</p>}
          {loading && <p className={panel.empty}>Đang tải…</p>}
        </div>
      </div>
      {message && <p className={panel.message}>{message}</p>}
    </AdminShell>
  );
}
