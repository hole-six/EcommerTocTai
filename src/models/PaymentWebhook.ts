import { Schema, model, models } from "mongoose";

const paymentWebhook = new Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    referenceCode: { type: String, default: "" },
    paymentCode: { type: String, default: "", index: true },
    amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["processed", "ignored", "rejected"],
      required: true,
    },
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);

export const PaymentWebhook =
  models.PaymentWebhook || model("PaymentWebhook", paymentWebhook);
