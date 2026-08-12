import { NextResponse } from "next/server";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function GET() {
  try {
    await requireAdmin();
    await connectDb();
    const [totals] = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]);
    const byStatus = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const byDay = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: "cancelled" } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.name", quantity: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]);
    const customerCount = await User.countDocuments({ role: "customer" });
    const guestPhones = await Order.distinct("customer.phone", { user: null });
    return NextResponse.json({
      data: {
        revenue: totals?.revenue ?? 0,
        orders: totals?.orders ?? 0,
        customerCount,
        guestCustomerCount: guestPhones.length,
        byStatus: byStatus.map((row) => ({ status: row._id as string, count: row.count as number })),
        byDay: byDay.map((row) => ({ date: row._id as string, revenue: row.revenue as number, orders: row.orders as number })),
        topProducts: topProducts.map((row) => ({ name: row._id as string, quantity: row.quantity as number, revenue: row.revenue as number })),
      },
    });
  } catch (error) { return apiError(error); }
}
