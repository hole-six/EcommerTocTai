"use client";

import { Eye, EyeOff, Plus, Save, Trash2, UserRound, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPagination, AdminTableToolbar } from "@/components/admin/AdminTableTools";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import panel from "@/components/admin/admin-panel.module.css";
import { showToast } from "@/components/ui/Toast";
import { extractApiError } from "@/lib/client/errors";
import styles from "./reviews.module.css";

type Review = {
  _id: string; rating: number; title: string; body: string; isPublished: boolean;
  source?: "customer" | "admin"; createdAt: string; product?: { name: string };
  user?: { fullName: string }; guestName?: string;
};
type UserOption = { _id: string; fullName: string; phone?: string; email?: string };
type ProductOption = { _id: string; name: string; sku?: string; slug?: string };
type ReviewDraft = {
  authorMode: "user" | "custom"; userId: string; guestName: string; productId: string;
  rating: number; title: string; body: string; isPublished: boolean;
};

const PAGE_SIZE = 10;
const emptyDraft: ReviewDraft = {
  authorMode: "user", userId: "", guestName: "", productId: "", rating: 5,
  title: "", body: "", isPublished: true,
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [draft, setDraft] = useState<ReviewDraft>(emptyDraft);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (status !== "all") params.set("status", status);
    try {
      const response = await fetch(`/api/admin/reviews?${params.toString()}`);
      const body = await response.json();
      setReviews(body.data ?? []);
      setTotal(body.pagination?.total ?? (body.data ?? []).length);
      setPageCount(body.pagination?.pages ?? 1);
    } finally { setLoading(false); }
  }, [debouncedSearch, page, status]);

  useEffect(() => { void loadReviews(); }, [loadReviews, refreshKey]);
  useEffect(() => {
    if (!drawerOpen) return;
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", closeWithEscape);
    return () => document.removeEventListener("keydown", closeWithEscape);
  }, [drawerOpen]);

  async function openCreateDrawer() {
    setDraft(emptyDraft); setDrawerOpen(true); setMessage("");
    if (users.length || products.length) return;
    setLoadingOptions(true);
    try {
      const response = await fetch("/api/admin/reviews/options");
      const body = await response.json();
      if (!response.ok) throw new Error(extractApiError(body, "Không thể tải dữ liệu lựa chọn."));
      setUsers(body.data?.users ?? []); setProducts(body.data?.products ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tải dữ liệu lựa chọn.");
    } finally { setLoadingOptions(false); }
  }

  async function createReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setSubmitting(true);
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: draft.authorMode === "user" ? draft.userId : "",
          guestName: draft.authorMode === "custom" ? draft.guestName.trim() : "",
          productId: draft.productId, rating: draft.rating, title: draft.title,
          body: draft.body, isPublished: draft.isPublished,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(extractApiError(body, "Không thể tạo đánh giá."));
      setMessage("Đã tạo đánh giá và hiển thị trên sản phẩm đã chọn.");
      showToast("Đã tạo đánh giá và hiển thị trên sản phẩm đã chọn.", "success");
      setDraft(emptyDraft); setDrawerOpen(false); setPage(1);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể tạo đánh giá.";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally { setSubmitting(false); }
  }

  async function toggle(review: Review) {
    setMessage("");
    const response = await fetch(`/api/admin/reviews/${review._id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !review.isPublished }),
    });
    if (!response.ok) {
      const errorMessage = extractApiError(await response.json(), "Không thể cập nhật đánh giá.");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }
    setReviews((current) => current.map((item) =>
      item._id === review._id ? { ...item, isPublished: !review.isPublished } : item,
    ));
    showToast(review.isPublished ? "Đã ẩn đánh giá." : "Đã hiện đánh giá.", "success");
  }

  async function remove(id: string) {
    if (!confirm("Xóa đánh giá này?")) return;
    setMessage("");
    const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const errorMessage = extractApiError(await response.json(), "Không thể xóa đánh giá.");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }
    showToast("Đã xóa đánh giá.", "success");
    if (reviews.length === 1 && page > 1) setPage((value) => value - 1);
    else setRefreshKey((value) => value + 1);
  }

  const authorReady = draft.authorMode === "user"
    ? Boolean(draft.userId) : draft.guestName.trim().length >= 2;

  return (
    <AdminShell breadcrumb="Đánh giá">
      <div className={panel.header}>
        <div><p>THƯƠNG MẠI / ĐÁNH GIÁ</p><h1>Đánh giá sản phẩm</h1></div>
        <button className={panel.saveButton} type="button" onClick={() => void openCreateDrawer()}>
          <Plus size={15} /> Tạo đánh giá
        </button>
      </div>
      {message && <p className={panel.message}>{message}</p>}

      <div className={panel.panel}>
        <AdminTableToolbar
          search={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Tìm sản phẩm, khách hàng hoặc nội dung..."
          filters={<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="all">Tất cả trạng thái</option><option value="published">Đang hiển thị</option><option value="hidden">Đã ẩn</option>
          </select>}
          right={<strong>{total} đánh giá</strong>}
        />
        <div className={panel.tableWrap}>
          <table>
            <thead><tr><th>Sản phẩm</th><th>Khách hàng</th><th>Điểm</th><th>Nội dung</th><th>Trạng thái</th><th className={panel.rightCell}>Thao tác</th></tr></thead>
            <tbody>{reviews.map((review) => (
              <tr key={review._id}>
                <td data-label="Sản phẩm"><b>{review.product?.name ?? "-"}</b>{review.source === "admin" && <span className={styles.seedBadge}>Seeding</span>}</td>
                <td data-label="Khách hàng">{review.user?.fullName ?? review.guestName ?? "-"}</td>
                <td data-label="Điểm" className={styles.tableStars}>{"★".repeat(review.rating)}</td>
                <td data-label="Nội dung" style={{ maxWidth: 320 }}>{review.title && <><b>{review.title}</b><br /></>}{review.body}</td>
                <td data-label="Trạng thái"><span className={`${panel.status} ${review.isPublished ? panel.green : panel.gray}`}>{review.isPublished ? "Hiển thị" : "Đã ẩn"}</span></td>
                <td data-full="true"><div className={panel.tableActions}>
                  <button className={`${panel.iconButton} ${panel.editButton}`} onClick={() => void toggle(review)}>{review.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}{review.isPublished ? "Ẩn" : "Hiện"}</button>
                  <button className={`${panel.iconButton} ${panel.dangerIconButton}`} onClick={() => void remove(review._id)} aria-label="Xóa đánh giá"><Trash2 size={14} /></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
          {!loading && reviews.length === 0 && <p className={panel.empty}>Không có đánh giá phù hợp.</p>}
          {loading && <p className={panel.empty}>Đang tải...</p>}
        </div>
        {!loading && reviews.length > 0 && <AdminPagination page={page} pageCount={pageCount} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />}
      </div>

      {drawerOpen && <>
        <button className={styles.backdrop} type="button" onClick={() => setDrawerOpen(false)} aria-label="Đóng drawer" />
        <form className={styles.drawer} onSubmit={createReview}>
          <header className={styles.drawerHeader}>
            <div><span>QUẢN TRỊ VIÊN TẠO</span><h2>Tạo đánh giá seeding</h2><p>Chọn khách hàng có sẵn hoặc dùng một tên hiển thị bất kỳ.</p></div>
            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Đóng drawer"><X size={19} /></button>
          </header>
          <div className={styles.drawerBody}>
            {loadingOptions ? <p className={panel.empty}>Đang tải khách hàng và sản phẩm...</p> : <>
              <section className={styles.drawerSection}>
                <div className={styles.sectionTitle}><UserRound size={16} /><b>Người đánh giá</b></div>
                <div className={styles.modeSwitch}>
                  <button type="button" className={draft.authorMode === "user" ? styles.modeActive : ""} onClick={() => setDraft((current) => ({ ...current, authorMode: "user", guestName: "" }))}>Khách hàng hệ thống</button>
                  <button type="button" className={draft.authorMode === "custom" ? styles.modeActive : ""} onClick={() => setDraft((current) => ({ ...current, authorMode: "custom", userId: "" }))}>Nhập tên bất kỳ</button>
                </div>
                {draft.authorMode === "user" ? <label>Khách hàng <b>*</b>
                  <SearchableSelect value={draft.userId} onChange={(userId) => setDraft((current) => ({ ...current, userId }))}
                    options={users.map((user) => ({ value: user._id, label: user.fullName, description: user.phone || user.email || "Không có thông tin liên hệ", keywords: `${user.phone ?? ""} ${user.email ?? ""}` }))}
                    placeholder="Chọn khách hàng" searchPlaceholder="Tìm theo tên, SĐT hoặc email..." />
                </label> : <label>Tên hiển thị <b>*</b><input value={draft.guestName} onChange={(event) => setDraft((current) => ({ ...current, guestName: event.target.value }))} minLength={2} maxLength={100} placeholder="Ví dụ: Minh Anh" autoFocus /></label>}
              </section>
              <section className={styles.drawerSection}><label>Sản phẩm <b>*</b>
                <SearchableSelect value={draft.productId} onChange={(productId) => setDraft((current) => ({ ...current, productId }))}
                  options={products.map((product) => ({ value: product._id, label: product.name, description: product.sku || product.slug, keywords: `${product.sku ?? ""} ${product.slug ?? ""}` }))}
                  placeholder="Chọn sản phẩm được đánh giá" searchPlaceholder="Tìm theo tên, SKU hoặc slug..." />
              </label></section>
              <fieldset className={styles.ratingField}><legend>Số sao *</legend><div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" className={rating <= draft.rating ? styles.activeStar : ""} onClick={() => setDraft((current) => ({ ...current, rating }))} aria-label={`${rating} sao`}>★</button>)}<strong>{draft.rating}/5</strong>
              </div></fieldset>
              <label className={styles.fullField}>Tiêu đề<input maxLength={120} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Ví dụ: Sản phẩm rất tốt" /></label>
              <label className={styles.fullField}>Nội dung đánh giá <b>*</b><textarea required minLength={3} maxLength={2000} rows={6} value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} placeholder="Nhập nội dung đánh giá..." /></label>
              <label className={styles.checkLabel}><input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))} />Hiển thị ngay trên trang sản phẩm</label>
            </>}
            {message && <p className={panel.message}>{message}</p>}
          </div>
          <footer className={styles.drawerFooter}>
            <button type="button" className={styles.cancelButton} onClick={() => setDrawerOpen(false)}>Hủy</button>
            <button className={panel.saveButton} disabled={loadingOptions || submitting || !authorReady || !draft.productId || draft.body.trim().length < 3} type="submit"><Save size={15} /> {submitting ? "Đang tạo..." : "Tạo đánh giá"}</button>
          </footer>
        </form>
      </>}
    </AdminShell>
  );
}
