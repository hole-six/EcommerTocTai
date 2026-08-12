import { NextResponse } from "next/server";
import { Order } from "@/models/Order";
import { requireUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function GET() {
  try {
    const session = await requireUser();
    await connectDb();
    return NextResponse.json({ data: await Order.find({ user: session.id }).sort({ createdAt: -1 }).lean() });
  } catch (error) { return apiError(error); }
}
