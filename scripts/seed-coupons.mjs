import { readFile } from "node:fs/promises";
import mongoose, { Schema } from "mongoose";

for (const filename of [".env.local", ".env"]) {
  try {
    const text = await readFile(filename, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {}
}
if (!process.env.MONGODB_URI) throw new Error("Cần MONGODB_URI trong .env.local hoặc .env.");

const schema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percent", "fixed"], default: "percent" },
    value: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const Coupon = mongoose.models.Coupon ?? mongoose.model("Coupon", schema);

const days = (count) => new Date(Date.now() + count * 24 * 60 * 60 * 1000);

const coupons = [
  { code: "WELCOME10", type: "percent", value: 10, minOrderValue: 0, maxDiscount: 50000, usageLimit: null, expiresAt: null },
  { code: "NEWUSER20", type: "percent", value: 20, minOrderValue: 200000, maxDiscount: 100000, usageLimit: 500, expiresAt: days(90) },
  { code: "FREESHIP", type: "fixed", value: 30000, minOrderValue: 300000, maxDiscount: null, usageLimit: null, expiresAt: null },
  { code: "GIAM20K", type: "fixed", value: 20000, minOrderValue: 150000, maxDiscount: null, usageLimit: null, expiresAt: null },
  { code: "GIAM50K", type: "fixed", value: 50000, minOrderValue: 500000, maxDiscount: null, usageLimit: null, expiresAt: null },
  { code: "VIP15", type: "percent", value: 15, minOrderValue: 300000, maxDiscount: 150000, usageLimit: null, expiresAt: null },
  { code: "SALE50", type: "percent", value: 50, minOrderValue: 500000, maxDiscount: 200000, usageLimit: 200, expiresAt: days(30) },
  { code: "FLASH100K", type: "fixed", value: 100000, minOrderValue: 1000000, maxDiscount: null, usageLimit: 50, expiresAt: days(14) },
];

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB ?? "toc_tai" });
for (const coupon of coupons) {
  await Coupon.findOneAndUpdate(
    { code: coupon.code },
    { $setOnInsert: { ...coupon, usedCount: 0, isActive: true } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  console.log(`OK  ${coupon.code}`);
}
await mongoose.disconnect();
console.log(`Đã seed ${coupons.length} mã giảm giá (bỏ qua mã đã tồn tại).`);
