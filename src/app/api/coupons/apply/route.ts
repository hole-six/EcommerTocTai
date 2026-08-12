import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { resolveCoupon } from "@/lib/server/coupons";

const applySchema = z.object({ code: z.string().min(1), subtotal: z.number().min(0) });

export async function POST(request: Request) {
  try {
    const { code, subtotal } = applySchema.parse(await request.json());
    await connectDb();
    const result = await resolveCoupon(code, subtotal);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ data: { code: result.coupon.code, discount: result.discount, type: result.coupon.type, value: result.coupon.value } });
  } catch (error) { return apiError(error); }
}
