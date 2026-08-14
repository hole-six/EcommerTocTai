"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminPagination,
  AdminTableToolbar,
} from "@/components/admin/AdminTableTools";
import panel from "@/components/admin/admin-panel.module.css";
import { extractApiError } from "@/lib/client/errors";

type Review = {
  _id: string;
  rating: number;
  title: string;
  body: string;
  isPublished: boolean;
  createdAt: string;
  product?: { name: string };
  user?: { fullName: string };
  guestName?: string;
  guestPhone?: string;
};

const PAGE_SIZE = 10;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
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
  useEffect(() => { void loadReviews(); }, [loadReviews, refreshKey]);

  async function toggle(review: Review) {
    setMessage("");
    const response = await fetch(`/api/admin/reviews/${review._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !review.isPublished }),
    });
    if (!response.ok) {
      const body = await response.json();
      setMessage(extractApiError(body, "Không thể cập nhật đánh giá."));
      return;
    }
    setReviews((current) =>
      current.map((item) =>
        item._id === review._id
          ? { ...item, isPublished: !review.isPublished }
          : item,
      ),
    );
  }

  async function remove(id: string) {
    if (!confirm("Xóa đánh giá này?")) return;
    setMessage("");
    const response = await fetch(`/api/admin/reviews/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json();
      setMessage(extractApiError(body, "Không thể xóa đánh giá."));
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
      </div>

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
                  </td>
                  <td data-label="Khách hàng">
                    {review.user?.fullName ??
                      (review.guestName
                        ? `${review.guestName} (${review.guestPhone ?? "khách"})`
                        : "-")}
                  </td>
                  <td data-label="Điểm">{"★".repeat(review.rating)}</td>
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
                        {review.isPublished ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
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
      {message && <p className={panel.message}>{message}</p>}
    </AdminShell>
  );
}
