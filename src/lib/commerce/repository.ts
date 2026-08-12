import { CatalogProduct } from "@/models/CatalogProduct";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { connectDb } from "@/lib/server/db";
import type { CommerceOrder, CommerceProduct, DashboardSnapshot } from "./types";

const toProduct = (product: { id: string; slug: string; name: string; price: number; inventory: number; status: CommerceProduct["status"]; category: string }): CommerceProduct => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  price: product.price,
  inventory: product.inventory,
  status: product.status,
  category: product.category,
});

export const commerceRepository = {
  async listProducts(): Promise<CommerceProduct[]> {
    await connectDb();
    const products = await CatalogProduct.find().sort({ createdAt: -1 }).lean();
    return products.map((product) => toProduct({ id: product.id, slug: product.slug, name: product.name, price: product.price, inventory: product.inventory, status: product.status, category: product.category }));
  },

  async dashboard(): Promise<DashboardSnapshot> {
    await connectDb();
    const [summary] = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]);
    const [products, recentOrders, customers] = await Promise.all([
      CatalogProduct.find().sort({ createdAt: -1 }).lean(),
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
      User.countDocuments({ role: "customer" }),
    ]);
    const lowStock = products.filter((product) => product.status === "active" && product.inventory < 10).map((product) => toProduct({ id: product.id, slug: product.slug, name: product.name, price: product.price, inventory: product.inventory, status: product.status, category: product.category }));
    const orders: CommerceOrder[] = recentOrders.map((order) => ({
      id: order.orderNumber,
      customerName: order.customer?.fullName ?? "Khách vãng lai",
      total: order.total ?? 0,
      status: order.status === "confirmed" ? "processing" : order.status,
      createdAt: order.createdAt.toISOString(),
    }));
    return {
      revenue: summary?.revenue ?? 0,
      orders: summary?.orders ?? 0,
      customers,
      conversionRate: 0,
      lowStock,
      recentOrders: orders,
    };
  },
};