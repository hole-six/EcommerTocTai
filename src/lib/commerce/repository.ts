import type { CommerceOrder, CommerceProduct, DashboardSnapshot } from "./types";

// Temporary adapter: replace only this file when MongoDB/Prisma is connected.
const products: CommerceProduct[] = [
  { id: "prd_serum_001", slug: "serum-moc-toc-5", name: "Serum Mọc Tóc 5%", price: 349000, inventory: 8, status: "active", category: "Tóc rụng" },
  { id: "prd_shampoo_001", slug: "dau-goi-sach-da-dau", name: "Dầu Gội Sạch Da Đầu", price: 239000, inventory: 37, status: "active", category: "Da đầu" },
  { id: "prd_mask_001", slug: "bo-phuc-hoi", name: "Bộ Phục Hồi Tóc Hư Tổn", price: 579000, inventory: 5, status: "active", category: "Phục hồi" },
];
const orders: CommerceOrder[] = [
  { id: "TT-20918", customerName: "Nguyễn Khánh Linh", total: 349000, status: "paid", createdAt: "2026-08-11T09:10:00+07:00" },
  { id: "TT-20917", customerName: "Trần Minh Hoàng", total: 579000, status: "processing", createdAt: "2026-08-11T08:45:00+07:00" },
];

export const commerceRepository = {
  listProducts: (): CommerceProduct[] => products,
  dashboard: (): DashboardSnapshot => ({ revenue: 24860000, orders: 1284, customers: 384, conversionRate: 4.82, lowStock: products.filter((product) => product.inventory < 10), recentOrders: orders }),
};
