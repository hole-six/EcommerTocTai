import { NextResponse } from "next/server";
import { Banner } from "@/models/Banner";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { bannerSchema } from "@/lib/server/banner-validator";
import { onlyProvidedFields } from "@/lib/server/validators";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/banners/[id]">,
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const raw = await request.json();
    const data = onlyProvidedFields(bannerSchema.partial().parse(raw), raw);
    await connectDb();
    const banner = await Banner.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    return banner
      ? NextResponse.json({ data: banner })
      : NextResponse.json({ error: "Không tìm thấy banner" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/banners/[id]">,
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await connectDb();
    const banner = await Banner.findByIdAndDelete(id);
    return banner
      ? NextResponse.json({ data: { success: true } })
      : NextResponse.json({ error: "Không tìm thấy banner" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}
