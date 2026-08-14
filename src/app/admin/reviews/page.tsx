"use client";

import { Eye, EyeOff, Plus, Save, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPagination, AdminTableToolbar } from "@/components/admin/AdminTableTools";
import panel from "@/components/admin/admin-panel.module.css";
import { extractApiError } from "@/lib/client/errors";
import styles from "./reviews.module.css";

type Review = {
  _id: string;
  rating: number;
  title: string;
  body: string;
  isPublished: boolean;
  source?: "customer" | "admin";
  createdAt: string;
  product?: { name: string };
  user?: { fullName: string };
  guestName?: string;
  guestPhone?: string;
};
type UserOption = { _id: string; fullName: string; phone?: string; email?: string };
type ProductOption = { _id: string; name: string; sku?: string };
type ReviewDraft = {
  userId: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  isPublished: boolean;
};

const PAGE_SIZE = 10;
const emptyDraft: ReviewDraft = {
  userId: "",
  productId: "",
  rating: 5,
  title: "",
  body: "",
  isPublished: true,
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [draft, setDraft] = useState<ReviewDraft>(emptyDraft);
  const [showForm, setShowForm] = useState(false);
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
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, status]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews, refreshKey]);

  async function openCreateForm() {
    setShowForm(true);
    setMessage("");
    if (users.length || products.length) return;
    setLoadingOptions(true);
    try {
      const response = await fetch("/api/admin/reviews/options");
      const body = await response.json();
      if (!response.ok) {
        setMessage(extractApiError(body, "Không thể tải người dùng và sản phẩm."));
        return;
      }
      setUsers(body.data?.users ?? []);
      setProducts(body.data?.products ?? []);
    } catch {
      setMessage("Không thể tải người dùng và sản phẩm.");
    } finally {
      setLoadingOptions(false);
    }
  }

  async function createReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(extractApiError(body, "Không thể tạo đánh giá."));
        return;
      }
      setMessage("Đã tạo đánh giá và hiển thị trên sản phẩm đã chọn.");
      setDraft(emptyDraft);
      setPage(1);
      setRefreshKey((value) => value + 1);
    } catch {
      setMessage("Không thể tạo đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(review: Review) {
    setMessage("");
    const response = await fetch(`/api/admin/reviews/${review._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !review.isPublished }),
    });
    if (!response.ok) {
      setMessage(extractApiError(await response.json(), "Không thể cập nhật đánh giá."));
      return;
    }
    setReviews((current) =>
      current.map((item) =>
        item._id === review._id ? { ...item, isPublished: !review.isPublished } : item,
      ),
    );
  }

  async function remove(id: string) {
    if (!confirm("Xóa đánh giá này?")) return;
    setMessage("");
    const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage(extractApiError(await response.json(), "Không thể xóa đánh giá."));
      return;
    }
    if (reviews.length === 1 && page > 1) setPage((value) => value - 1);
    else setRefreshKey((value) => value + 1);
  }

  return (
    <AdminShell breadcrumb="Đánh giá">
      <div className={panel.header}>
        <div>
          <p>THƯƠNG MẠI / ĐÁNH GIÁ</p>
          <h1>Đánh giá sản phẩm</h1>
        </div>
        <div className={panel.headerActions}>
          <button
            className={panel.saveButton}
            type="button"
            onClick={() => (showForm ? setShowForm(false) : void openCreateForm())}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "Đóng" : "Tạo đánh giá"}
          </button>
        </div>
      </div>

      {showForm && (
        <form className={`${panel.panel} ${styles.createPanel}`} onSubmit={createReview}>
          <div className={panel.panelPad}>
            <div className={styles.formHeading}>
              <div>
                <h2>Tạo đánh giá seeding</h2>
                <p>Chọn tài khoản khách hàng và sản phẩm sẽ nhận đánh giá.</p>
              </div>
              <span>QUẢN TRỊ VIÊN TẠO</span>
            </div>
            {loadingOptions ? (
              <p className={panel.empty}>Đang tải danh sách...</p>
            ) : (
              <>
                <div className={styles.formGrid}>
                  <label>
                    Người dùng <b>*</b>
                    <select
                      required
                      value={draft.userId}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, userId: event.target.value }))
                      }
                    >
                      <option value="">Chọn người dùng</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.fullName} · {user.phone || user.email || "Không có liên hệ"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Sản phẩm <b>*</b>
                    <select
                      required
                      value={draft.productId}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, productId: event.target.value }))
                      }
                    >
                      <option value="">Chọn sản phẩm</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}{product.sku ? ` · ${product.sku}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <fieldset className={styles.ratingField}>
                  <legend>Số sao *</legend>
                  <div className={styles.stars}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        className={rating <= draft.rating ? styles.activeStar : ""}
                        onClick={() => setDraft((current) => ({ ...current, rating }))}
                        aria-label={`${rating} sao`}
                      >
                        ★
                      </button>
                    ))}
                    <strong>{draft.rating}/5</strong>
                  </div>
                </fieldset>

                <label className={styles.fullField}>
                  Tiêu đề
                  <input
                    maxLength={120}
                    value={draft.title}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Ví dụ: Sản phẩm rất tốt"
                  />
                </label>
                <label className={styles.fullField}>
                  Nội dung đánh giá <b>*</b>
                  <textarea
                    required
                    minLength={3}
                    maxLength={2000}
                    rows={5}
                    value={draft.body}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, body: event.target.value }))
                    }
                    placeholder="Nhập nội dung đánh giá sẽ hiển thị cho khách hàng..."
                  />
                </label>

                <div className={styles.formFooter}>
                  <label className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={draft.isPublished}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          isPublished: event.target.checked,
                        }))
                      }
                    />
                    Hiển thị ngay trên trang sản phẩm
                  </label>
                  <button
                    className={panel.saveButton}
                    disabled={
                      submitting ||
                      !draft.userId ||
                      !draft.productId ||
                      draft.body.trim().length < 3
                    }
                    type="submit"
                  >
                    <Save size={15} /> {submitting ? "Đang tạo..." : "Tạo đánh giá"}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      )}

      {message && <p className={panel.message}>{message}</p>}

      <div className={panel.panel}>
        <AdminTableToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Tìm sản phẩm, khách hàng hoặc nội dung..."
          filters={
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đang hiển thị</option>
              <option value="hidden">Đã ẩn</option>
            </select>
          }
          right={<strong>{total} đánh giá</strong>}
        />
        <div className={panel.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Khách hàng</th>
                <th>Điểm</th>
                <th>Nội dung</th>
                <th>Trạng thái</th>
                <th className={panel.rightCell}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td data-label="Sản phẩm">
                    <b>{review.product?.name ?? "-"}</b>
                    {review.source === "admin" && (
                      <span className={styles.seedBadge}>Seeding</span>
                    )}
                  </td>
                  <td data-label="Khách hàng">
                    {review.user?.fullName ??
                      (review.guestName
                        ? `${review.guestName} (${review.guestPhone ?? "khách"})`
                        : "-")}
                  </td>
                  <td data-label="Điểm" className={styles.tableStars}>
                    {"★".repeat(review.rating)}
                  </td>
                  <td data-label="Nội dung" style={{ maxWidth: 320 }}>
                    {review.title && (
                      <b>
                        {review.title}
                        <br />
                      </b>
                    )}
                    {review.body}
                  </td>
                  <td data-label="Trạng thái">
                    <span
                      className={`${panel.status} ${
                        review.isPublished ? panel.green : panel.gray
                      }`}
                    >
                      {review.isPublished ? "Hiển thị" : "Đã ẩn"}
                    </span>
                  </td>
                  <td data-full="true">
                    <div className={panel.tableActions}>
                      <button
                        className={`${panel.iconButton} ${panel.editButton}`}
                        onClick={() => void toggle(review)}
                      >
                        {review.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                        {review.isPublished ? "Ẩn" : "Hiện"}
                      </button>
                      <button
                        className={`${panel.iconButton} ${panel.dangerIconButton}`}
                        onClick={() => void remove(review._id)}
                        aria-label="Xóa đánh giá"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && reviews.length === 0 && (
            <p className={panel.empty}>Không có đánh giá phù hợp.</p>
          )}
          {loading && <p className={panel.empty}>Đang tải...</p>}
        </div>
        {!loading && reviews.length > 0 && (
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
