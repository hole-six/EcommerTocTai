import { Schema, model, models } from "mongoose";

const media = new Schema({
  url: { type: String, required: true },
  originalName: { type: String, default: "" },
  size: { type: Number, default: 0 },
  mimeType: { type: String, default: "" },
}, { timestamps: true });
export const Media = models.Media || model("Media", media);
