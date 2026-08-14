import { Schema, model, models } from "mongoose";

const review = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    guestName: { type: String, default: "" },
    guestPhone: { type: String, default: "", index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    body: { type: String, required: true },
    isPublished: { type: Boolean, default: true },
    source: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);
review.index({ product: 1, order: 1 }, { unique: true });
export const Review = models.Review || model("Review", review);
