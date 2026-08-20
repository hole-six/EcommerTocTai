import { Coupon } from "@/models/Coupon";

// Số điện thoại được lưu lẫn lộn giữa dạng 0912... và +84912..., nên phải đưa
// về một dạng chung trước khi so sánh.
export function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/[^0-9+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+84")) return `0${digits.slice(3)}`;
  if (digits.startsWith("84") && digits.length >= 10) return `0${digits.slice(2)}`;
  return digits;
}

// Mã có danh sách khách hàng riêng chỉ dành cho những người trong danh sách đó;
// cả hai danh sách rỗng nghĩa là mã dùng chung cho tất cả khách. Khách đã đăng
// nhập khớp theo tài khoản, khách vãng lai khớp theo số điện thoại.
export function isCouponForCustomer(
  customers: unknown,
  customerPhones: unknown,
  userId?: string | null,
  phone?: string | null,
) {
  const accounts = Array.isArray(customers) ? customers : [];
  const phones = Array.isArray(customerPhones) ? customerPhones : [];
  if (accounts.length === 0 && phones.length === 0) return true;
  if (userId && accounts.some((entry) => String(entry) === String(userId))) return true;
  const normalized = normalizePhone(phone);
  return Boolean(
    normalized && phones.some((entry) => normalizePhone(entry) === normalized),
  );
}

export async function resolveCoupon(
  code: string,
  subtotal: number,
  shippingFee = 0,
  userId?: string | null,
  phone?: string | null,
) {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() }).lean();
  if (!coupon || !coupon.isActive) return { error: "Mã giảm giá không tồn tại hoặc đã ngừng áp dụng" };
  if (!isCouponForCustomer(coupon.customers, coupon.customerPhones, userId, phone))
    return { error: "Mã giảm giá này chỉ dành riêng cho một số khách hàng" };
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
