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
  // Danh sách khách hàng được dùng mã. Mảng rỗng = mã dùng chung cho tất cả.
  customers: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [], index: true },
  // Số điện thoại được dùng mã, đã chuẩn hoá về dạng 0xxxxxxxxx. Dùng cho khách
  // vãng lai (đặt hàng không cần tài khoản) nên không có _id để tham chiếu.
  customerPhones: { type: [String], default: [], index: true },
}, { timestamps: true });
export const Coupon = models.Coupon || model("Coupon", coupon);
