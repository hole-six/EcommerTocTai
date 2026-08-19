import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

export async function GET() {
  try {
    await requireAdmin();
    await connectDb();

    const [users, products] = await Promise.all([
      User.find({ role: "customer", isActive: true })
        .select("fullName phone email")
        .sort({ fullName: 1, createdAt: -1 })
        .limit(2000)
        .lean(),
      Product.find({ status: "active" })
        .select("name sku slug status")
        .sort({ name: 1, createdAt: -1 })
        .limit(2000)
        .lean(),
    ]);

    return NextResponse.json({ data: { users, products } });
  } catch (error) {
    return apiError(error);
  }
}
