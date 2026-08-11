export type ProductStatus = "draft" | "active" | "archived";
export type OrderStatus = "pending" | "paid" | "processing" | "shipping" | "completed" | "cancelled";

export type CommerceProduct = { id: string; slug: string; name: string; price: number; inventory: number; status: ProductStatus; category: string };
export type CommerceOrder = { id: string; customerName: string; total: number; status: OrderStatus; createdAt: string };
export type DashboardSnapshot = { revenue: number; orders: number; customers: number; conversionRate: number; lowStock: CommerceProduct[]; recentOrders: CommerceOrder[] };
