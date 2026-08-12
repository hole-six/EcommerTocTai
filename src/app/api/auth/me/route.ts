import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { User } from "@/models/User";

export async function GET() {
  try {
    const session = await currentUser();
    if (!session) return NextResponse.json({ data: null });
    await connectDb();
    const user = await User.findById(session.id).select("-passwordHash").lean();
    return NextResponse.json({ data: user });
  } catch (error) { return apiError(error); }
}
