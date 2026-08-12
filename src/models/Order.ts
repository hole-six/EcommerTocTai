import { Schema, model, models } from "mongoose";

const address = new Schema(
  {
    recipientName: String,
    phone: String,
    province: String,
    district: String,
    ward: String,
    addressLine: String,
  },
  { _id: false },
);
const item = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: false,
      default: null,
    },
    catalogProductId: { type: String, default: "" },
    name: String,
    sku: String,
    quantity: { type: Number, min: 1 },
    unitPrice: Number,
    image: String,
    variantId: { type: String, default: "" },
    variantTitle: { type: String, default: "" },
    options: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false },
);
const order = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    customer: {
      fullName: String,
      phone: { type: String, index: true },
      email: String,
    },
    shippingAddress: { type: address, required: true },
    items: { type: [item], default: [] },
    subtotal: Number,
    shippingFee: Number,
    couponCode: { type: String, default: "" },
    discount: { type: Number, default: 0 },
    total: Number,
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipping",
        "completed",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    inventoryState: {
      type: String,
      enum: [
        "none",
        "reserving",
        "reserved",
        "committing",
        "committed",
        "releasing",
        "released",
        "returning",
        "returned",
      ],
      default: "none",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "bank_transfer", "vnpay", "sepay"],
      default: "cod",
    },
    paymentCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: "",
    },
    paymentTransactionId: { type: String, default: "", index: true },
    paymentReceivedAt: { type: Date, default: null },
    trackingNumber: { type: String, default: "" },
    shippingProvider: {
      type: String,
      enum: ["ghn", "ghtk", "viettelpost", "jt", "manual"],
      default: "manual",
    },
    shippedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
export const Order = models.Order || model("Order", order);
