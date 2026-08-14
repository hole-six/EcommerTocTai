"use client";

import Link from "next/link";
import {
  Edit3,
  Eye,
  PackagePlus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPagination } from "@/components/admin/AdminTableTools";
import panel from "@/components/admin/admin-panel.module.css";
import { extractApiError } from "@/lib/client/errors";
import styles from "./products.module.css";

type Product = {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  salePrice?: number;
  inventory: number;
  reservedInventory?: number;
  status: "draft" | "active" | "archived";
  images: string[];
  shortDescription?: string;
  category?: ({ name: string } | string)[] | { name: string } | string;
  source?: "catalog";
};
type CategoryOption = { _id: string; label: string };

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const statusTone = { draft: "gray", active: "green", archived: "red" } as const;
const statusLabel = {
  draft: "Bản nháp",
  active: "Đang bán",
  archived: "Ngừng bán",
} as const;
const categoryName = (category?: Product["category"]) => {
  const list = Array.isArray(category) ? category : category ? [category] : [];
  return list.length
    ? list.map((c) => (typeof c === "string" ? c : (c?.name ?? "-"))).join(", ")
    : "-";
};
const PAGE_SIZE = 10;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [message, setMessage] = useState("");
  const [inventoryDrafts, setInventoryDrafts] = useState<Record<string, string>>(
    {},
  );
  const [savingInventoryId, setSavingInventoryId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/categories?tree=true")
      .then((response) => response.json())
      .then((body) => {
        const options: CategoryOption[] = [];
        for (const root of body.data ?? []) {
          options.push({ _id: root._id, label: root.name });
          for (const child of root.children ?? [])
            options.push({ _id: child._id, label: `- ${child.name}` });
        }
        setCategories(options);
      });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, category]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        status: "all",
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (status !== "all") params.set("productStatus", status);
      if (category !== "all") params.set("category", category);
      const response = await fetch(
        `/api/commerce/products?${params.toString()}`,
        { cache: "no-store" },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(extractApiError(body, "Không tải được sản phẩm"));
      setProducts(body.data ?? []);
      setTotal(body.pagination?.total ?? (body.data ?? []).length);
      setPageCount(body.pagination?.pages ?? 1);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không tải được sản phẩm",
      );
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch, page, status]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function saveInventory(product: Product) {
    const draft = inventoryDrafts[product._id];
    if (draft === undefined) return;
    const inventory = Number(draft);
    const reserved = product.reservedInventory ?? 0;
    if (!Number.isInteger(inventory) || inventory < reserved) {
      setMessage(
        `Tồn kho không thể thấp hơn ${reserved} sản phẩm đang được giữ cho đơn hàng.`,
      );
      return;
    }

    setSavingInventoryId(product._id);
    setMessage("");
    try {
      const response = await fetch(`/api/commerce/products/${product._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(extractApiError(body, "Không thể cập nhật tồn kho"));
      setProducts((current) =>
        current.map((item) =>
          item._id === product._id ? { ...item, inventory } : item,
        ),
      );
      setInventoryDrafts((current) => {
        const next = { ...current };
        delete next[product._id];
        return next;
      });
      setMessage(`Đã cập nhật tồn kho ${product.name}.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không thể cập nhật tồn kho",
      );
    } finally {
      setSavingInventoryId(null);
    }
  }

  async function archive(product: Product) {
    if (!window.confirm(`Ẩn sản phẩm "${product.name}" khỏi cửa hàng?`)) return;
    const response = await fetch(`/api/commerce/products/${product._id}`, {
      method: "DELETE",
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage(extractApiError(body, "Không thể xóa sản phẩm"));
      return;
    }
    setProducts((current) =>
      current.map((item) =>
        item._id === product._id ? { ...item, status: "archived" } : item,
      ),
    );
    setMessage(`Đã ngừng bán ${product.name}.`);
  }

  async function restore(product: Product) {
    const response = await fetch(`/api/commerce/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "draft" }),
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage(extractApiError(body, "Không thể khôi phục sản phẩm"));
      return;
    }
    setProducts((current) =>
      current.map((item) =>
        item._id === product._id ? { ...item, status: "draft" } : item,
      ),
    );
    setMessage(`Đã khôi phục ${product.name} về bản nháp.`);
  }

  return (
    <AdminShell breadcrumb="Sản phẩm">
      <div className={panel.header}>
        <div>
          <p>THƯƠNG MẠI / SẢN PHẨM</p>
          <h1>Quản lý sản phẩm</h1>
          <span className={styles.subtitle}>
            Tạo, chỉnh sửa, tìm kiếm và cập nhật tồn kho ngay trên từng sản
            phẩm.
          </span>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => void loadProducts()}
          >
            <RefreshCw size={15} /> Làm mới
          </button>
          <Link href="/admin/products/new" className={panel.primaryButton}>
            <PackagePlus size={16} /> Tạo sản phẩm mới
          </Link>
        </div>
      </div>

      <div className={panel.panel}>
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, SKU, slug hoặc mô tả..."
              aria-label="Tìm kiếm sản phẩm"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Lọc trạng thái"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="draft">Bản nháp</option>
            <option value="archived">Ngừng bán</option>
          </select>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Lọc danh mục"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((item) => (
              <option key={item._id} value={item._id}>
                {item.label}
              </option>
            ))}
          </select>
          <strong className={styles.resultCount}>{total} sản phẩm</strong>
        </div>
        {message && <p className={panel.message}>{message}</p>}
        <div className={panel.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>SKU</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th className={styles.actionHeading}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const reserved = product.reservedInventory ?? 0;
                const draft = inventoryDrafts[product._id];
                const inventoryValue = draft ?? String(product.inventory);
                const changed = draft !== undefined;
                return (
                  <tr key={`${product.source ?? "product"}-${product._id}`}>
                    <td data-label="Sản phẩm">
                      <div className={styles.productCell}>
                        {product.images[0] ? (
                          <img src={product.images[0]} alt="" />
                        ) : (
                          <div className={styles.imagePlaceholder}>
                            <PackagePlus size={17} />
                          </div>
                        )}
                        <div>
                          <b>{product.name}</b>
                          <span>{product.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="SKU">
                      <code>{product.sku}</code>
                    </td>
                    <td data-label="Danh mục">{categoryName(product.category)}</td>
                    <td data-label="Giá">
                      <b>{money.format(product.salePrice ?? product.price)}</b>
                      {product.salePrice && (
                        <>
                          <br />
                          <span className={styles.oldPrice}>
                            {money.format(product.price)}
                          </span>
                        </>
                      )}
                    </td>
                    <td data-label="Tồn kho">
                      <div className={styles.inventoryControl}>
                        <input
                          type="number"
                          min={reserved}
                          value={inventoryValue}
                          onChange={(event) =>
                            setInventoryDrafts((current) => ({
                              ...current,
                              [product._id]: event.target.value,
                            }))
                          }
                          aria-label={`Tồn kho ${product.name}`}
                          className={product.inventory < 10 ? styles.lowStockInput : ""}
                        />
                        <button
                          type="button"
                          disabled={!changed || savingInventoryId === product._id}
                          onClick={() => void saveInventory(product)}
                          title="Lưu tồn kho"
                        >
                          <Save size={13} />
                        </button>
                      </div>
                      {reserved > 0 && (
                        <small className={styles.reservedStock}>
                          Đang giữ {reserved}
                        </small>
                      )}
                    </td>
                    <td data-label="Trạng thái">
                      <span
                        className={`${panel.status} ${
                          panel[statusTone[product.status]]
                        }`}
                      >
                        {statusLabel[product.status]}
                      </span>
                    </td>
                    <td data-full="true">
                      <div className={styles.actions}>
                        <Link
                          href={`/admin/products/${product._id}`}
                          className={styles.editButton}
                        >
                          <Edit3 size={14} /> Sửa
                        </Link>
                        <Link
                          href={`/san-pham/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.viewButton}
                          aria-label={`Xem ${product.name}`}
                        >
                          <Eye size={14} />
                        </Link>
                        {product.status === "archived" ? (
                          <button
                            type="button"
                            className={styles.editButton}
                            onClick={() => void restore(product)}
                            title="Khôi phục về bản nháp"
                          >
                            <RotateCcw size={14} /> Khôi phục
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => void archive(product)}
                            aria-label={`Ngừng bán ${product.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && products.length === 0 && (
            <div className={styles.empty}>
              <PackagePlus size={28} />
              <b>Không tìm thấy sản phẩm</b>
              <span>Thử từ khóa khác hoặc tạo sản phẩm mới.</span>
              <Link href="/admin/products/new" className={panel.primaryButton}>
                Tạo sản phẩm
              </Link>
            </div>
          )}
          {loading && <p className={panel.empty}>Đang tải sản phẩm...</p>}
        </div>
        {!loading && products.length > 0 && (
          <AdminPagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>
    </AdminShell>
  );
}
