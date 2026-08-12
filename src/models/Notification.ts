import { Schema, model, models } from "mongoose";

const notification = new Schema(
  {
    recipientRole: {
      type: String,
      enum: ["admin", "customer"],
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["order", "payment", "chat", "system"],
      default: "system",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "", trim: true },
    href: { type: String, default: "" },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

notification.index({ recipientRole: 1, user: 1, readAt: 1, createdAt: -1 });

export const Notification =
  models.Notification || model("Notification", notification);
