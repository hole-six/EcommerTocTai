import { readFile } from "node:fs/promises";
import mongoose, { Schema } from "mongoose";

for (const filename of [".env.local", ".env"]) {
  try {
    const text = await readFile(filename, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {}
}
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required in .env.local");

const bannerSchema = new Schema({
  pageKey: { type: String, default: "home", index: true },
  slotKey: { type: String, default: "", index: true },
  placement: { type: String, default: "home_hero", index: true },
  categorySlug: { type: String, default: "", index: true },
  mediaType: { type: String, default: "image" },
  image: { type: String, required: true },
  mobileImage: { type: String, default: "" },
  videoUrl: { type: String, default: "" },
  alt: String, title: String, subtitle: String, ctaLabel: String, ctaHref: String,
  isActive: { type: Boolean, default: true }, sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
const Banner = mongoose.models.Banner ?? mongoose.model("Banner", bannerSchema);

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB ?? "toc_tai" });
const slots = [
  { slotKey: "home-hero-1", pageKey: "home", placement: "home_hero", image: "/sites/manmatters-com-61d14dee/root-8a5edab2/hero-hair.png", alt: "Giải pháp chăm sóc tóc", sortOrder: 0 },
  { slotKey: "home-hero-2", pageKey: "home", placement: "home_hero", image: "/sites/manmatters-com-61d14dee/root-8a5edab2/hero-wellness.png", alt: "Chăm sóc sức khỏe nam giới", sortOrder: 1 },
  { slotKey: "home-hero-3", pageKey: "home", placement: "home_hero", image: "/sites/manmatters-com-61d14dee/root-8a5edab2/hero-creatine.png", alt: "Hiệu suất nam giới", sortOrder: 2 },
  { slotKey: "all-products-top", pageKey: "all-products", placement: "all_products", image: "/sites/manmatters-com-61d14dee/root-8a5edab2/hero-assessment.png", alt: "Khám phá sản phẩm", sortOrder: 0 },
];
for (const slot of slots) await Banner.findOneAndUpdate({ slotKey: slot.slotKey }, { $set: slot }, { upsert: true, new: true, setDefaultsOnInsert: true });
await mongoose.disconnect();
console.log(`Seeded ${slots.length} fixed banner slots.`);
