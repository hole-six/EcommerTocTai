"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

type Review = { _id: string; rating: number; title: string; body: string; createdAt: string; user?: { fullName: string }; guestName?: string };

const ratingLabels = ["Tệ", "Không hài lòng", "Bình thường", "Hài lòng", "Tuyệt vời"];
const inputClass = "w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-blue focus:outline-none";

export function ReviewModal({
  productId,
  productName,
  productImage,
  loggedIn,
  onClose,
  onSubmitted,
}: {
  productId: string;
  productName: string;
  productImage?: string;
  loggedIn: boolean;
  onClose: () => void;
  onSubmitted: (review: Review) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const displayRating = hoverRating || rating;
  const valid = rating > 0 && body.trim().length >= 10 && (loggedIn || (guestName.trim().length >= 2 && guestPhone.trim().length >= 9));

  async function submit() {
    if (!valid) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title, body, ...(loggedIn ? {} : { guestName, guestPhone }) }),
      });
      const responseBody = await response.json();
      if (!response.ok) throw new Error(responseBody.error ?? "Gửi đánh giá thất bại");
      onSubmitted(responseBody.data);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gửi đánh giá thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-brand-ink">Viết đánh giá</h2>
          <button onClick={onClose} aria-label="Đóng" className="grid h-8 w-8 place-items-center rounded-full border border-neutral-200 text-brand-muted hover:bg-neutral-50">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-bg p-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
            {productImage && <Image src={productImage} alt={productName} fill className="object-cover" />}
          </div>
          <b className="text-sm text-brand-ink">{productName}</b>
        </div>

        <p className="mt-5 text-sm font-bold text-brand-navy">Đánh giá sản phẩm này</p>
        <div className="mt-2 flex justify-between">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="flex flex-col items-center gap-1"
            >
              <span className={`text-3xl ${star <= displayRating ? "text-brand-gold" : "text-neutral-300"}`}>★</span>
              <span className="text-[10px] text-brand-muted">{ratingLabels[star - 1]}</span>
            </button>
          ))}
        </div>

        {!loggedIn && (
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-bold text-brand-navy">Họ tên
              <input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Tên của bạn" className={`mt-1.5 ${inputClass}`} />
            </label>
            <label className="block text-sm font-bold text-brand-navy">Số điện thoại
              <input value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} placeholder="Số điện thoại đã đặt hàng" className={`mt-1.5 ${inputClass}`} />
              <span className="mt-1 block text-xs font-normal text-brand-muted">Dùng để xác nhận bạn đã mua và nhận sản phẩm này.</span>
            </label>
          </div>
        )}

        <label className="mt-5 block text-sm font-bold text-brand-navy">Tiêu đề đánh giá
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tóm tắt trải nghiệm của bạn…" className={`mt-1.5 ${inputClass}`} />
        </label>
        <label className="mt-5 block text-sm font-bold text-brand-navy">Nội dung đánh giá
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Chia sẻ chi tiết trải nghiệm của bạn…" rows={4} className={`mt-1.5 ${inputClass}`} />
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-full bg-neutral-900 py-3 text-sm font-bold text-white hover:bg-neutral-800">Hủy</button>
          <button onClick={submit} disabled={!valid || submitting} className="flex-1 rounded-full bg-brand-navy py-3 text-sm font-bold text-white hover:bg-brand-blue disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400">{submitting ? "Đang gửi…" : "Lưu"}</button>
        </div>
      </div>
    </div>
  );
}
