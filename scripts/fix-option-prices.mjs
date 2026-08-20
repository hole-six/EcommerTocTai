// Sửa giá lựa chọn (optionGroups) của những sản phẩm nhập trước khi lỗi nền giá
// được vá.
//
// Bối cảnh: form admin quy đổi "giá khách trả" thành priceAdjustment bằng cách
// trừ đi GIÁ GỐC (price), trong khi storefront và API tạo đơn lại cộng
// priceAdjustment vào GIÁ BÁN (salePrice ?? price). Với sản phẩm có khuyến mãi,
// hai nền giá lệch nhau đúng bằng (price - salePrice) nên khách thấy giá thấp
// hơn con số admin đã nhập.
//
// Cách sửa: adjustment_đúng = adjustment_cũ + (price - salePrice).
// Bỏ qua lựa chọn có adjustment = 0 vì đó là ô admin để trống (nghĩa là "dùng
// đúng giá bán"), vốn đã đúng ở cả hai cách tính.
//
// Chạy thử (chỉ in ra, không ghi):  node scripts/fix-option-prices.mjs
// Ghi thật:                          node scripts/fix-option-prices.mjs --apply
//
// CHỈ CHẠY MỘT LẦN. Chạy --apply lần thứ hai sẽ cộng lệch thêm một lần nữa.

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

const schema = new Schema(
  {
    name: String,
    slug: String,
    price: Number,
    salePrice: Number,
    optionGroups: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true, minimize: false, strict: false },
);
const Product = mongoose.models.Product ?? mongoose.model("Product", schema);

const money = (value) => `${Math.round(value).toLocaleString("vi-VN")}đ`;

await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB ?? "toc_tai",
  serverSelectionTimeoutMS: 5000,
});

const products = await Product.find({
  salePrice: { $gt: 0 },
  "optionGroups.0": { $exists: true },
}).lean();

let changedProducts = 0;
let changedOptions = 0;

for (const product of products) {
  const price = Number(product.price ?? 0);
  const salePrice = Number(product.salePrice ?? 0);
  const gap = price - salePrice;
  if (!gap) continue;

  let touched = false;
  const groups = (product.optionGroups ?? []).map((group) => {
    if ((group?.pricingMode ?? "replace") !== "replace") return group;
    const options = (group.options ?? []).map((option) => {
      const current = Number(option?.priceAdjustment ?? 0);
      if (!current) return option;
      const next = current + gap;
      touched = true;
      changedOptions += 1;
      console.log(
        `  ${product.name} › ${group.title ?? group.code ?? "?"} › ${option.label ?? option.value ?? "?"}: ` +
          `khách đang trả ${money(salePrice + current)} → sửa thành ${money(salePrice + next)}`,
      );
      return { ...option, priceAdjustment: next };
    });
    return { ...group, options };
  });

  if (!touched) continue;
  changedProducts += 1;
  if (apply) {
    await Product.updateOne({ _id: product._id }, { $set: { optionGroups: groups } });
  }
}

console.log(
  `\n${apply ? "Đã sửa" : "Sẽ sửa"} ${changedOptions} lựa chọn trong ${changedProducts} sản phẩm.`,
);
if (!apply && changedOptions > 0) {
  console.log("Chạy lại với --apply để ghi vào database.");
}

await mongoose.disconnect();
