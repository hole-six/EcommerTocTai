import { NextResponse } from "next/server";
import { Coupon } from "@/models/Coupon";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { couponSchema, onlyProvidedFields } from "@/lib/server/validators";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const raw = await request.json();
    const data = onlyProvidedFields(couponSchema.partial().parse(raw), raw);
    await connectDb();
    const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return coupon ? NextResponse.json({ data: coupon }) : NextResponse.json({ error: "Không tìm thấy mã giảm giá" }, { status: 404 });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await connectDb();
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ data: { success: true } });
  } catch (error) { return apiError(error); }
}
