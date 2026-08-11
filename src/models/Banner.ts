import { Schema, model, models } from "mongoose";

const banner = new Schema({ placement: { type: String, enum: ["home_hero", "home_promo", "category"], default: "home_hero", index: true }, image: { type: String, required: true }, mobileImage: { type: String, default: "" }, alt: { type: String, required: true, default: "Banner Tóc Tai" }, title: { type: String, default: "" }, subtitle: { type: String, default: "" }, ctaLabel: { type: String, default: "Khám phá ngay" }, ctaHref: { type: String, default: "/shop/all" }, isActive: { type: Boolean, default: true }, sortOrder: { type: Number, default: 0 } }, { timestamps: true });
export const Banner = models.Banner || model("Banner", banner);
