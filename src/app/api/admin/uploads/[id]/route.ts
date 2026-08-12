import { unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { Media } from "@/models/Media";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await connectDb();
    const record = await Media.findByIdAndDelete(id);
    if (record?.url?.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", record.url)).catch(() => undefined);
    }
    return NextResponse.json({ data: { success: true } });
  } catch (error) { return apiError(error); }
}
