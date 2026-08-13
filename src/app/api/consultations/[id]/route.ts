import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { Consultation } from "@/models/Consultation";

const patchSchema = z.object({
  status: z.enum(["submitted", "contacted", "completed", "cancelled"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const data = patchSchema.parse(await request.json());
    await connectDb();
    const consultation = await Consultation.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    return consultation
      ? NextResponse.json({ data: consultation })
      : NextResponse.json({ error: "Không tìm thấy tư vấn" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await connectDb();
    await Consultation.findByIdAndDelete(id);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return apiError(error);
  }
}
