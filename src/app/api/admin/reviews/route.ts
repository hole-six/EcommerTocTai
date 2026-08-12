import { NextResponse } from "next/server";
import { Review } from "@/models/Review";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function GET() {
  try {
    await requireAdmin();
    await connectDb();
    const reviews = await Review.find().populate("product", "name slug").populate("user", "fullName").sort({ createdAt: -1 }).lean();
    return NextResponse.json({ data: reviews });
  } catch (error) { return apiError(error); }
}
