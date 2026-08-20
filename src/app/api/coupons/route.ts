import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { normalizePhone } from "@/lib/server/coupons";
import { Coupon } from "@/models/Coupon";

export async function GET(request: Request) {
  try {
    await connectDb();
    const session = await currentUser();
    const phone = normalizePhone(
      new URL(request.url).searchParams.get("phone"),
    );
    const now = new Date();
    // Mã có danh sách khách riêng chỉ hiện với đúng khách đó; mã không giới hạn
    // (mảng rỗng, hoặc thiếu trường với dữ liệu cũ) thì hiện cho tất cả.
    const audience: Record<string, unknown>[] = [
      {
        $and: [
          { $or: [{ customers: { $size: 0 } }, { customers: { $exists: false } }] },
          {
            $or: [
              { customerPhones: { $size: 0 } },
              { customerPhones: { $exists: false } },
            ],
          },
        ],
      },
    ];
    if (session?.id) audience.push({ customers: session.id });
    if (phone) audience.push({ customerPhones: phone });
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
