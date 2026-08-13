export type OrderStatus = "pending" | "confirmed" | "processing" | "shipping" | "completed" | "cancelled" | "returned";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type ShippingProvider = "ghn" | "ghtk" | "viettelpost" | "jt" | "best" | "spx" | "manual";

export const statusLabel: Record<OrderStatus, string> = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", processing: "Đang đóng gói", shipping: "Đang giao", completed: "Hoàn tất", cancelled: "Đã huỷ", returned: "Hoàn hàng" };
export const paymentLabel: Record<PaymentStatus, string> = { unpaid: "Chưa thanh toán", paid: "Đã thanh toán", refunded: "Đã hoàn tiền" };
export const providerLabel: Record<ShippingProvider, string> = { manual: "Tự nhập / khác", ghn: "Giao Hàng Nhanh", ghtk: "Giao Hàng Tiết Kiệm", viettelpost: "Viettel Post", jt: "J&T Express", best: "Best Express", spx: "SPX Express (Shopee)" };

const trackingUrlBuilders: Partial<Record<ShippingProvider, (code: string) => string>> = {
  ghn: (code) => `https://donhang.ghn.vn/?order_code=${encodeURIComponent(code)}`,
  ghtk: (code) => `https://i.ghtk.vn/${encodeURIComponent(code)}`,
  viettelpost: (code) => `https://tracking.viettelpost.vn/?order_number=${encodeURIComponent(code)}`,
  jt: (code) => `https://jtexpress.vn/tracking?billcode=${encodeURIComponent(code)}`,
  best: (code) => `https://best-inc.vn/orderQuery?bill_code=${encodeURIComponent(code)}`,
  spx: (code) => `https://spx.vn/track?spxTrackingNumber=${encodeURIComponent(code)}`,
};

export function trackingUrl(provider: ShippingProvider | undefined, code: string | undefined): string | null {
  const trimmed = code?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!provider) return null;
  const build = trackingUrlBuilders[provider];
  return build ? build(trimmed) : null;
}
