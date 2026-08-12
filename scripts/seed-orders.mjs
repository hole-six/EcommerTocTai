import { readFile } from "node:fs/promises";
import mongoose, { Schema } from "mongoose";

for (const filename of [".env.local", ".env"]) {
  try {
    const text = await readFile(filename, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]])
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {}
}
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
const productSchema = new Schema(
  {
    name: String,
    sku: String,
    price: Number,
    salePrice: Number,
    images: [String],
  },
  { strict: false },
);
const orderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true },
    user: Schema.Types.ObjectId,
    customer: Schema.Types.Mixed,
    shippingAddress: Schema.Types.Mixed,
    items: [Schema.Types.Mixed],
    subtotal: Number,
    shippingFee: Number,
    couponCode: String,
    discount: Number,
    total: Number,
    status: String,
    inventoryState: { type: String, default: "none" },
    paymentStatus: String,
    paymentMethod: String,
    trackingNumber: String,
    shippingProvider: String,
    note: String,
  },
  { timestamps: true },
);
const userSchema = new Schema(
  { fullName: String, phone: String },
  { strict: false },
);
const Product =
  mongoose.models.Product ?? mongoose.model("Product", productSchema);
const Order = mongoose.models.Order ?? mongoose.model("Order", orderSchema);
const User = mongoose.models.User ?? mongoose.model("User", userSchema);
await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB ?? "toc_tai",
});
const products = await Product.find().limit(4).lean();
if (!products.length)
  throw new Error("Seed catalog before orders: npm run seed:catalog");
const people = [
  ["Nguyễn Minh Anh", "0901234567", "Hà Nội"],
  ["Trần Quốc Huy", "0912345678", "Hồ Chí Minh"],
  ["Lê Hoàng Nam", "0987654321", "Đà Nẵng"],
  ["Phạm Gia Bảo", "0934567890", "Hà Nội"],
  ["Đỗ Đức Long", "0968123456", "Cần Thơ"],
  ["Vũ Thanh Tùng", "0978123456", "Hải Phòng"],
];
const statuses = [
  "pending",
  "confirmed",
  "processing",
  "shipping",
  "completed",
  "cancelled",
];
for (let index = 0; index < people.length; index += 1) {
  const [fullName, phone, province] = people[index];
  const product = products[index % products.length];
  const user = await User.findOne({ phone }).select("_id").lean();
  const price = product.salePrice ?? product.price ?? 299000;
  const quantity = (index % 3) + 1;
  const subtotal = price * quantity;
  const status = statuses[index];
  const shippingFee = subtotal >= 499000 ? 0 : 30000;
  const couponCode =
    index === 1
      ? "WELCOME10"
      : index === 2
        ? "FREESHIP"
        : index === 4
          ? "COMBO100"
          : "";
  const discount =
    couponCode === "WELCOME10"
      ? Math.min(Math.round(subtotal * 0.1), 100000)
      : couponCode === "FREESHIP"
        ? 30000
        : couponCode === "COMBO100"
          ? 100000
          : 0;
  await Order.findOneAndUpdate(
    { orderNumber: `TT-DEMO-${String(index + 1).padStart(3, "0")}` },
    {
      $set: {
        orderNumber: `TT-DEMO-${String(index + 1).padStart(3, "0")}`,
        user: user?._id ?? null,
        customer: { fullName, phone, email: `demo${index + 1}@example.com` },
        shippingAddress: {
          recipientName: fullName,
          phone,
          province,
          district: "",
          ward: "Phường trung tâm",
          addressLine: `${20 + index} Đường Demo`,
        },
        items: [
          {
            product: product._id,
            name: product.name,
            sku: product.sku,
            quantity,
            unitPrice: price,
            image: product.images?.[0] ?? "",
          },
        ],
        subtotal,
        shippingFee,
        couponCode,
        discount,
        total: subtotal + shippingFee - discount,
        status,
        paymentStatus: index === 0 || index === 4 ? "unpaid" : "paid",
        paymentMethod: index % 2 ? "bank_transfer" : "cod",
        shippingProvider:
          status === "shipping" || status === "completed" ? "ghn" : "manual",
        trackingNumber:
          status === "shipping" || status === "completed"
            ? `GHNDEMO${1000 + index}`
            : "",
        note: "Đơn mẫu có liên kết tài khoản khách hàng để kiểm thử quản trị.",
      },
    },
    { upsert: true },
  );
}
for (const order of await Order.find({
  orderNumber: /^TT-DEMO-/,
  inventoryState: { $in: [null, "none"] },
}).lean()) {
  const committed = order.status === "completed";
  const releasable = order.status === "cancelled";
  for (const line of order.items) {
    const quantity = Number(line.quantity ?? 0);
    if (!line.product || quantity < 1) continue;
    if (committed)
      await Product.updateOne(
        { _id: line.product, inventory: { $gte: quantity } },
        { $inc: { inventory: -quantity } },
      );
    else if (!releasable)
      await Product.updateOne(
        {
          _id: line.product,
          $expr: {
            $gte: [
              {
                $subtract: [
                  { $ifNull: ["$inventory", 0] },
                  { $ifNull: ["$reservedInventory", 0] },
                ],
              },
              quantity,
            ],
          },
        },
        { $inc: { reservedInventory: quantity } },
      );
  }
  await Order.updateOne(
    { _id: order._id },
    {
      $set: {
        inventoryState: committed
          ? "committed"
          : releasable
            ? "released"
            : "reserved",
      },
    },
  );
}
await mongoose.disconnect();
console.log(`Seeded ${people.length} demo orders.`);
