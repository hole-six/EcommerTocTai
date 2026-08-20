// Chuyển những mã giảm giá "chỉ định khách hàng" (cơ chế cũ) sang "mã ẩn".
//
// Bối cảnh: trước đây mã riêng được giới hạn bằng danh sách customers /
// customerPhones. Cơ chế đó đã bị bỏ, thay bằng cờ isHidden: mã ẩn không hiện
// trong danh sách gợi ý ở trang thanh toán, ai biết mã thì tự gõ vào.
//
// Nếu không chạy script này, những mã riêng cũ sẽ mất hết giới hạn VÀ bị liệt kê
// công khai cho mọi khách — đúng thứ không ai muốn. Script đặt isHidden = true
// cho chúng (giữ đúng tinh thần "không phát rộng rãi") rồi xoá hai trường cũ.
//
// Chạy thử (chỉ in ra, không ghi):  node scripts/hide-targeted-coupons.mjs
// Ghi thật:                          node scripts/hide-targeted-coupons.mjs --apply
//
// Chạy lại nhiều lần không sao: lần sau sẽ không còn mã nào khớp điều kiện.

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

const apply = process.argv.includes("--apply");

const schema = new Schema({ code: String }, { timestamps: true, strict: false });
const Coupon = mongoose.models.Coupon ?? mongoose.model("Coupon", schema);

await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB ?? "toc_tai",
  serverSelectionTimeoutMS: 5000,
});

const targeted = await Coupon.find({
  $or: [
    { "customers.0": { $exists: true } },
    { "customerPhones.0": { $exists: true } },
  ],
}).lean();

if (targeted.length === 0) {
  console.log("Không có mã nào dùng cơ chế chỉ định khách hàng cũ. Không cần làm gì.");
} else {
  console.log(`Tìm thấy ${targeted.length} mã dùng cơ chế cũ:\n`);
  for (const coupon of targeted) {
    const accounts = coupon.customers?.length ?? 0;
    const phones = coupon.customerPhones?.length ?? 0;
    const already = coupon.isHidden ? " (đã là mã ẩn)" : "";
    console.log(
      `  ${coupon.code.padEnd(20)} ${accounts} tài khoản, ${phones} số điện thoại -> đặt isHidden = true${already}`,
    );
  }
  console.log("");

  if (!apply) {
    console.log("Đây là chạy thử, chưa ghi gì vào database.");
    console.log("Chạy lại với --apply để ghi thật.");
  } else {
    const result = await Coupon.updateMany(
      {
        $or: [
          { "customers.0": { $exists: true } },
          { "customerPhones.0": { $exists: true } },
        ],
      },
      { $set: { isHidden: true }, $unset: { customers: "", customerPhones: "" } },
    );
    console.log(`Đã cập nhật ${result.modifiedCount} mã.`);
    console.log("Vào trang /admin/coupons kiểm tra lại, mã nào muốn công khai thì bỏ tick 'Mã ẩn'.");
  }
}

await mongoose.disconnect();
