export type OrderStatus = "pending" | "confirmed" | "processing" | "shipping" | "completed" | "cancelled" | "returned";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type ShippingProvider = "ghn" | "ghtk" | "viettelpost" | "jt" | "manual";

export const statusLabel: Record<OrderStatus, string> = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", processing: "Đang đóng gói", shipping: "Đang giao", completed: "Hoàn tất", cancelled: "Đã huỷ", returned: "Hoàn hàng" };
export const paymentLabel: Record<PaymentStatus, string> = { unpaid: "Chưa thanh toán", paid: "Đã thanh toán", refunded: "Đã hoàn tiền" };
export const providerLabel: Record<ShippingProvider, string> = { manual: "Tự nhập / khác", ghn: "Giao Hàng Nhanh", ghtk: "Giao Hàng Tiết Kiệm", viettelpost: "Viettel Post", jt: "J&T Express" };
