"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import panel from "@/components/admin/admin-panel.module.css";

type Review = { _id: string; rating: number; title: string; body: string; isPublished: boolean; createdAt: string; product?: { name: string }; user?: { fullName: string }; guestName?: string; guestPhone?: string };

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/admin/reviews").then((response) => response.json()).then((body) => setReviews(body.data ?? [])).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function toggle(review: Review) {
    const response = await fetch(`/api/admin/reviews/${review._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublished: !review.isPublished }) });
    if (response.ok) setReviews((current) => current.map((item) => (item._id === review._id ? { ...item, isPublished: !review.isPublished } : item)));
  }

  async function remove(id: string) {
    if (!confirm("Xóa đánh giá này?")) return;
    const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (response.ok) setReviews((current) => current.filter((item) => item._id !== id));
  }

  return (
    <AdminShell breadcrumb="Đánh giá">
      <div className={panel.header}>
        <div>
          <p>COMMERCE / ĐÁNH GIÁ</p>
          <h1>Đánh giá sản phẩm</h1>
        </div>
      </div>
      <div className={panel.panel}>
        <div className={panel.tableWrap}>
          <table>
            <thead><tr><th>Sản phẩm</th><th>Khách hàng</th><th>Đánh giá</th><th>Nội dung</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td><b>{review.product?.name ?? "—"}</b></td>
                  <td>{review.user?.fullName ?? (review.guestName ? `${review.guestName} (khách vãng lai, ${review.guestPhone})` : "—")}</td>
                  <td>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</td>
                  <td style={{ maxWidth: 280 }}>{review.title && <b>{review.title}<br /></b>}{review.body}</td>
                  <td><span className={`${panel.status} ${review.isPublished ? panel.green : panel.gray}`}>{review.isPublished ? "Hiển thị" : "Đã ẩn"}</span></td>
                  <td className={panel.actions}>
                    <button className={panel.ghostButton} onClick={() => toggle(review)}>{review.isPublished ? "Ẩn" : "Hiện"}</button>
                    <button className={panel.dangerButton} onClick={() => remove(review._id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && reviews.length === 0 && <p className={panel.empty}>Chưa có đánh giá nào.</p>}
          {loading && <p className={panel.empty}>Đang tải…</p>}
        </div>
      </div>
    </AdminShell>
  );
}
