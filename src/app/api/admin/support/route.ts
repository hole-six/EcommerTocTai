import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { SupportThread } from "@/models/SupportThread";

export async function GET() {
  try {
    await requireAdmin();
    await connectDb();
    const threads = await SupportThread.find()
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ data: threads });
  } catch (error) {
    return apiError(error);
  }
}
