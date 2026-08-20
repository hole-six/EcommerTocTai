import { Schema, model, models } from "mongoose";

const coupon = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ["percent", "fixed"], default: "percent" },
  value: { type: Number, required: true, min: 0 },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  // Mã ẩn không xuất hiện trong danh sách gợi ý ở trang thanh toán. Ai biết mã
  // (thấy trên quảng cáo, bài đăng, tin nhắn...) tự gõ vào thì vẫn dùng được.
  isHidden: { type: Boolean, default: false, index: true },
}, { timestamps: true });
export const Coupon = models.Coupon || model("Coupon", coupon);
