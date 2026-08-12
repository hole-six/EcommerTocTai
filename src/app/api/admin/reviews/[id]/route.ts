import { NextResponse } from "next/server";
import { z } from "zod";
import { Review } from "@/models/Review";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

const patchSchema = z.object({ isPublished: z.boolean() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const data = patchSchema.parse(await request.json());
    await connectDb();
    const review = await Review.findByIdAndUpdate(id, data, { new: true });
    return review ? NextResponse.json({ data: review }) : NextResponse.json({ error: "Không tìm thấy đánh giá" }, { status: 404 });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await connectDb();
    await Review.findByIdAndDelete(id);
    return NextResponse.json({ data: { success: true } });
  } catch (error) { return apiError(error); }
}
