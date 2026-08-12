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
    const users = await User.find({ role: "customer" }).select("-passwordHash").lean();
    const userStats = await Order.aggregate([
      { $match: { user: { $ne: null } } },
      { $group: { _id: "$user", orderCount: { $sum: 1 }, totalSpent: { $sum: "$total" }, lastOrderAt: { $max: "$createdAt" } } },
    ]);
    const statsByUser = new Map(userStats.map((stat) => [stat._id.toString(), stat]));
    const registered = users.map((user) => {
      const stat = statsByUser.get(user._id.toString());
      return { id: user._id.toString(), fullName: user.fullName, phone: user.phone, email: user.email, isActive: user.isActive !== false, addresses: user.addresses ?? [], createdAt: user.createdAt, orderCount: stat?.orderCount ?? 0, totalSpent: stat?.totalSpent ?? 0, lastOrderAt: stat?.lastOrderAt ?? null };
    });

    const guestStats = await Order.aggregate([
      { $match: { user: null } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$customer.phone", fullName: { $first: "$customer.fullName" }, email: { $first: "$customer.email" }, orderCount: { $sum: 1 }, totalSpent: { $sum: "$total" }, lastOrderAt: { $max: "$createdAt" } } },
      { $sort: { lastOrderAt: -1 } },
    ]);
    const guests = guestStats.map((stat) => ({ phone: stat._id, fullName: stat.fullName, email: stat.email, orderCount: stat.orderCount, totalSpent: stat.totalSpent, lastOrderAt: stat.lastOrderAt }));

    return NextResponse.json({ data: { registered, guests } });
  } catch (error) { return apiError(error); }
}
