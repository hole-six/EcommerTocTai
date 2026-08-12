import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { profileSchema } from "@/lib/server/validators";
import { User } from "@/models/User";

export async function GET() {
  try {
    const session = await requireUser();
    await connectDb();
    const user = await User.findById(session.id).select("-passwordHash").lean();
    return NextResponse.json({ data: user });
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request) {
  try {
    const session = await requireUser();
    const data = profileSchema.parse(await request.json());
    await connectDb();
    const user = await User.findByIdAndUpdate(session.id, data, { new: true }).select("-passwordHash");
    return NextResponse.json({ data: user });
  } catch (error) { return apiError(error); }
}
