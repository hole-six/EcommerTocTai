import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { Coupon } from "@/models/Coupon";

export async function GET() {
  try {
    await connectDb();
    const session = await currentUser();
    const now = new Date();
    // Mã có danh sách khách riêng chỉ hiện với đúng khách đó; mã không giới hạn
    // (mảng rỗng, hoặc thiếu trường với dữ liệu cũ) thì hiện cho tất cả.
    const audience: Record<string, unknown>[] = [
      { customers: { $size: 0 } },
      { customers: { $exists: false } },
    ];
    if (session?.id) audience.push({ customers: session.id });
    const coupons = await Coupon.find({
      isActive: true,
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        { $or: audience },
      ],
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
