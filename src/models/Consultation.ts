import { Schema, model, models } from "mongoose";

const consultation = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  customer: { fullName: String, phone: { type: String, index: true }, email: String },
  category: { type: String, default: "hair" },
  answers: { type: Schema.Types.Mixed, default: {} },
  images: { type: [String], default: [] },
  appointment: { mode: { type: String, enum: ["now", "schedule"], default: "now" }, language: String, date: String, time: String },
  status: { type: String, enum: ["submitted", "contacted", "completed", "cancelled"], default: "submitted", index: true },
  result: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const Consultation = models.Consultation || model("Consultation", consultation);
