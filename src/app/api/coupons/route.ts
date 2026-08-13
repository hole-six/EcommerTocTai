import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { Coupon } from "@/models/Coupon";

export async function GET() {
  try {
    await connectDb();
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      $expr: { $or: [{ $eq: ["$usageLimit", null] }, { $lt: ["$usedCount", "$usageLimit"] }] },
    })
      .select("code type value minOrderValue maxDiscount expiresAt")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ data: coupons });
  } catch (error) {
    return apiError(error);
  }
}
