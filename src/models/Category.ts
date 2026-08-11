import { Schema, model, models } from "mongoose";

const detailField = new Schema({ key: { type: String, required: true }, label: { type: String, required: true }, type: { type: String, enum: ["text", "number", "select", "boolean"], default: "text" }, required: { type: Boolean, default: false }, options: { type: [String], default: [] } }, { _id: false });
const category = new Schema({
  parent: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  bannerImage: { type: String, default: "" },
  detailFields: { type: [detailField], default: [] },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
export const Category = models.Category || model("Category", category);
