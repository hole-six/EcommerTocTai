import { Schema, model, models } from "mongoose";

const settings = new Schema(
  {
    key: { type: String, unique: true, index: true, default: "store" },
    shippingFee: { type: Number, default: 30000 },
  },
  { timestamps: true },
);

export const Settings = models.Settings || model("Settings", settings);
