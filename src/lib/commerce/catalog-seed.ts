import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

const asset = "/sites/manmatters-com-61d14dee/root-8a5edab2/";
const parents = [
  { name: "Tóc", slug: "toc", image: `${asset}concern-hair.png`, bannerImage: "/images/anhtoctai1.avif", sortOrder: 1, detailFields: [{ key: "hair_type", label: "Loại tóc", type: "select", options: ["Mỏng yếu", "Khô xơ", "Dễ gãy rụng", "Da đầu dầu"] }] },
  { name: "Da đầu", slug: "da-dau", image: `${asset}concern-skin.png`, bannerImage: "/images/anhtoctai2.avif", sortOrder: 2, detailFields: [{ key: "scalp_type", label: "Tình trạng da đầu", type: "select", options: ["Dầu", "Khô", "Nhạy cảm", "Gàu"] }] },
  { name: "Phục hồi", slug: "phuc-hoi", image: `${asset}concern-beard.png`, bannerImage: "/images/anhtoctai3.avif", sortOrder: 3, detailFields: [{ key: "damage_level", label: "Mức độ hư tổn", type: "select", options: ["Nhẹ", "Trung bình", "Nặng"] }] },
  { name: "Dưỡng tóc", slug: "duong-toc", image: `${asset}concern-nutrition.png`, bannerImage: "/images/anhtoctai4.avif", sortOrder: 4, detailFields: [{ key: "routine_step", label: "Bước trong routine", type: "select", options: ["Gội", "Xả", "Ủ", "Tinh chất"] }] },
];
const children = [
  ["toc", "Bộ chăm sóc", "bo-cham-soc", 1], ["toc", "Tóc thưa mỏng", "toc-thua-mong", 2], ["toc", "Hỗ trợ mọc tóc", "ho-tro-moc-toc", 3], ["toc", "Gàu và ngứa", "gau-va-ngua", 4],
  ["da-dau", "Làm sạch sâu", "lam-sach-sau", 1], ["da-dau", "Da đầu nhạy cảm", "da-dau-nhay-cam", 2],
  ["phuc-hoi", "Tóc nhuộm", "toc-nhuom", 1], ["phuc-hoi", "Tóc khô xơ", "toc-kho-xo", 2],
  ["duong-toc", "Dầu gội", "dau-goi", 1], ["duong-toc", "Tinh chất", "tinh-chat", 2],
] as const;

export async function seedCatalog() {
  for (const parent of parents) await Category.findOneAndUpdate({ slug: parent.slug }, { $set: { ...parent, parent: null, isActive: true } }, { upsert: true, new: true });
  const roots = await Category.find({ slug: { $in: parents.map((parent) => parent.slug) } }).lean();
  const ids = new Map(roots.map((root) => [root.slug, root._id]));
  for (const [parentSlug, name, slug, sortOrder] of children) await Category.findOneAndUpdate({ slug }, { $set: { parent: ids.get(parentSlug), name, sortOrder, isActive: true } }, { upsert: true, new: true });
  const catalog = await Category.find().lean();
  const categoryId = (slug: string) => catalog.find((category) => category.slug === slug)?._id;
  const products = [
    ["serum-moc-toc-5", "Serum Mọc Tóc 5%", "ho-tro-moc-toc", 349000, 420000, "TT-SERUM-001", "Hỗ trợ routine chăm sóc tóc yếu và dễ gãy rụng.", "product-lotion.png"],
    ["dau-goi-sach-da-dau", "Dầu Gội Sạch Da Đầu", "lam-sach-sau", 239000, null, "TT-SHAMPOO-001", "Làm sạch dịu nhẹ, cho cảm giác thoáng nhẹ cả ngày.", "product-electrolyte.jpg"],
    ["bo-phuc-hoi-toc-hu-ton", "Bộ Phục Hồi Tóc Hư Tổn", "toc-kho-xo", 579000, 690000, "TT-REPAIR-001", "Bộ chăm sóc dành cho tóc khô xơ và thiếu độ ẩm.", "product-magnesium.jpg"],
    ["tinh-chat-da-dau", "Tinh Chất Cân Bằng Da Đầu", "da-dau-nhay-cam", 429000, null, "TT-SCALP-001", "Tinh chất lỏng nhẹ cho da đầu cần được chăm sóc dịu dàng.", "product-shilajit.png"],
  ] as const;
  for (const [slug, name, categorySlug, price, salePrice, sku, shortDescription, image] of products) {
    const category = categoryId(categorySlug);
    if (!category) continue;
    await Product.findOneAndUpdate({ slug }, { $set: { category, name, price, salePrice: salePrice ?? undefined, inventory: 25, sku, shortDescription, description: shortDescription, images: [`${asset}${image}`], specifications: { origin: "Việt Nam", usage: "Dùng theo hướng dẫn" }, status: "active" } }, { upsert: true, new: true });
  }
  return { categories: await Category.countDocuments(), products: await Product.countDocuments() };
}
