"use client";

import Link from "next/link";
import { Edit3, Eye, PackagePlus, RefreshCw, RotateCcw, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPagination } from "@/components/admin/AdminTableTools";
import panel from "@/components/admin/admin-panel.module.css";
import styles from "./products.module.css";

type Product = { _id: string; name: string; slug: string; sku: string; price: number; salePrice?: number; inventory: number; status: "draft" | "active" | "archived"; images: string[]; shortDescription?: string; category?: { name: string } | string; source?: "catalog" };
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const statusTone = { draft: "gray", active: "green", archived: "red" } as const;
const statusLabel = { draft: "Bản nháp", active: "Đang bán", archived: "Ngừng bán" } as const;
const categoryName = (category?: Product["category"]) => typeof category === "string" ? category : category?.name ?? "—";
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const pageSize = 10;

  async function loadProducts() {
    setLoading(true); setMessage("");
    try { const response = await fetch("/api/commerce/products?status=all", { cache: "no-store" }); const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Không tải được sản phẩm"); setProducts(body.data ?? []); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Không tải được sản phẩm"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadProducts(); }, []);

  const categories = useMemo(() => [...new Set(products.map((product) => categoryName(product.category)).filter((value) => value !== "—"))].sort(), [products]);
  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    return products.filter((product) => {
      const searchable = normalize([product.name, product.sku, product.slug, categoryName(product.category), product.shortDescription ?? ""].join(" "));
      return (!term || searchable.includes(term)) && (status === "all" || product.status === status) && (category === "all" || categoryName(product.category) === category);
    });
  }, [category, products, search, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function archive(product: Product) {
    if (!window.confirm(`Ẩn sản phẩm “${product.name}” khỏi cửa hàng?`)) return;
    const response = await fetch(`/api/commerce/products/${product._id}`, { method: "DELETE" });
    const body = await response.json();
    if (!response.ok) { setMessage(body.error ?? "Không thể xóa sản phẩm"); return; }
    setProducts((current) => current.map((item) => item._id === product._id ? { ...item, status: "archived" } : item));
    setMessage(`Đã ngừng bán ${product.name}.`);
  }

  async function restore(product: Product) {
    const response = await fetch(`/api/commerce/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "draft" }),
    });
    const body = await response.json();
    if (!response.ok) { setMessage(body.error ?? "Không thể khôi phục sản phẩm"); return; }
    setProducts((current) => current.map((item) => item._id === product._id ? { ...item, status: "draft" } : item));
    setMessage(`Đã khôi phục ${product.name} về bản nháp. Kiểm tra thông tin rồi bật Đang bán.`);
  }

  return <AdminShell breadcrumb="Sản phẩm">
    <div className={panel.header}>
      <div><p>COMMERCE / SẢN PHẨM</p><h1>Quản lý sản phẩm</h1><span className={styles.subtitle}>Tạo, chỉnh sửa, tìm kiếm và quản lý toàn bộ sản phẩm trong cửa hàng.</span></div>
      <div className={styles.headerActions}><button type="button" className={styles.refreshButton} onClick={() => void loadProducts()}><RefreshCw size={15} /> Làm mới</button><Link href="/admin/products/new" className={panel.primaryButton}><PackagePlus size={16} /> Tạo sản phẩm mới</Link></div>
    </div>
    <div className={panel.panel}>
      <div className={styles.toolbar}>
        <div className={styles.search}><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm theo tên, SKU, slug hoặc danh mục..." aria-label="Tìm kiếm sản phẩm" /></div>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Lọc trạng thái"><option value="all">Tất cả trạng thái</option><option value="active">Đang bán</option><option value="draft">Bản nháp</option><option value="archived">Ngừng bán</option></select>
        <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} aria-label="Lọc danh mục"><option value="all">Tất cả danh mục</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <strong className={styles.resultCount}>{filtered.length} sản phẩm</strong>
      </div>
      {message && <p className={panel.message}>{message}</p>}
      <div className={panel.tableWrap}><table><thead><tr><th>SẢN PHẨM</th><th>SKU</th><th>DANH MỤC</th><th>GIÁ</th><th>TỒN KHO</th><th>TRẠNG THÁI</th><th className={styles.actionHeading}>THAO TÁC</th></tr></thead><tbody>
        {visible.map((product) => <tr key={`${product.source ?? "product"}-${product._id}`}><td><div className={styles.productCell}>{product.images[0] ? <img src={product.images[0]} alt="" /> : <div className={styles.imagePlaceholder}><PackagePlus size={17} /></div>}<div><b>{product.name}</b><span>{product.slug}</span></div></div></td><td><code>{product.sku}</code></td><td>{categoryName(product.category)}</td><td><b>{money.format(product.salePrice ?? product.price)}</b>{product.salePrice && <><br /><span className={styles.oldPrice}>{money.format(product.price)}</span></>}</td><td><span className={product.inventory < 10 ? styles.lowStock : ""}>{product.inventory}</span></td><td><span className={`${panel.status} ${panel[statusTone[product.status]]}`}>{statusLabel[product.status]}</span></td><td><div className={styles.actions}><Link href={`/admin/products/${product._id}`} className={styles.editButton}><Edit3 size={14} /> Sửa</Link><Link href={`/san-pham/${product.slug}`} target="_blank" rel="noreferrer" className={styles.viewButton} aria-label={`Xem ${product.name}`}><Eye size={14} /></Link>{product.status === "archived" ? <button type="button" className={styles.editButton} onClick={() => void restore(product)} title="Khôi phục về bản nháp"><RotateCcw size={14} /> Khôi phục</button> : <button type="button" className={styles.deleteButton} onClick={() => void archive(product)} aria-label={`Ngừng bán ${product.name}`}><Trash2 size={14} /></button>}</div></td></tr>)}
      </tbody></table>{!loading && filtered.length === 0 && <div className={styles.empty}><PackagePlus size={28} /><b>Không tìm thấy sản phẩm</b><span>Thử từ khóa khác hoặc tạo sản phẩm mới.</span><Link href="/admin/products/new" className={panel.primaryButton}>Tạo sản phẩm</Link></div>}{loading && <p className={panel.empty}>Đang tải sản phẩm...</p>}</div>
      {!loading && <AdminPagination page={Math.min(page, pageCount)} pageCount={pageCount} total={filtered.length} pageSize={pageSize} onPageChange={setPage} />}
    </div>
  </AdminShell>;
}
