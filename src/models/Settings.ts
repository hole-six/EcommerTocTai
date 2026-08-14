import { Schema, model, models } from "mongoose";

const settings = new Schema(
  {
    key: { type: String, unique: true, index: true, default: "store" },
    shippingFee: { type: Number, default: 30000 },
    freeShippingThreshold: { type: Number, default: 200000 },
    faqs: { type: [Schema.Types.Mixed], default: [] },
    whyChooseUs: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);

export const Settings = models.Settings || model("Settings", settings);
