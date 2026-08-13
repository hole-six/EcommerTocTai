import { Coupon } from "@/models/Coupon";

export async function resolveCoupon(
  code: string,
  subtotal: number,
  shippingFee = 0,
) {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() }).lean();
  if (!coupon || !coupon.isActive) return { error: "Mã giảm giá không tồn tại hoặc đã ngừng áp dụng" };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) return { error: "Mã giảm giá đã hết hạn" };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { error: "Mã giảm giá đã hết lượt sử dụng" };
  if (subtotal < coupon.minOrderValue) return { error: `Đơn hàng cần tối thiểu ${coupon.minOrderValue.toLocaleString("vi-VN")}đ để áp dụng mã này` };
  // Percent-type coupons discount the product subtotal only; fixed-amount
  // coupons (e.g. a shipping voucher) can offset the full payable total,
  // so the cap must be against subtotal + shippingFee, not subtotal alone.
  const raw = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  const capped = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  const discount = Math.min(Math.round(capped), subtotal + shippingFee);
  return { coupon, discount };
}
