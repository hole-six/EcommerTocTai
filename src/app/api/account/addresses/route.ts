import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { accountAddressSchema } from "@/lib/server/validators";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const data = accountAddressSchema.parse(await request.json());
    await connectDb();
    const existing = await User.findById(session.id).select("addresses").lean();
    const isDefault = data.isDefault || !existing?.addresses?.length;
    if (isDefault) await User.findByIdAndUpdate(session.id, { $set: { "addresses.$[].isDefault": false } });
    const user = await User.findByIdAndUpdate(session.id, { $push: { addresses: { ...data, isDefault } } }, { new: true }).select("-passwordHash");
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) { return apiError(error); }
}
