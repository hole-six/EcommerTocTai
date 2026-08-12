import { Schema, model, models } from "mongoose";

const supportMessage = new Schema(
  {
    senderRole: {
      type: String,
      enum: ["customer", "admin"],
      required: true,
    },
    senderName: { type: String, default: "" },
    body: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const supportThread = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    visitorId: { type: String, default: "", index: true },
    customerName: { type: String, default: "Khách hàng" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    status: {
      type: String,
      enum: ["open", "pending", "closed"],
      default: "open",
      index: true,
    },
    unreadForAdmin: { type: Number, default: 0, min: 0 },
    unreadForCustomer: { type: Number, default: 0, min: 0 },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    messages: { type: [supportMessage], default: [] },
  },
  { timestamps: true },
);

supportThread.index({ status: 1, lastMessageAt: -1 });

export const SupportThread =
  models.SupportThread || model("SupportThread", supportThread);
