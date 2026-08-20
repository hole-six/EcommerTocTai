import { NextResponse } from "next/server";
import { Coupon } from "@/models/Coupon";
import "@/models/User";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { paginationMeta, parsePagination } from "@/lib/server/pagination";
import { couponSchema } from "@/lib/server/validators";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    await connectDb();
    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url);
    const [data, total] = await Promise.all([
      Coupon.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(),
    ]);
    return NextResponse.json({ data, pagination: paginationMeta(page, limit, total) });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) { try { await requireAdmin(); const data = couponSchema.parse(await request.json()); await connectDb(); return NextResponse.json({ data: await Coupon.create(data) }, { status: 201 }); } catch (error) { return apiError(error); } }
