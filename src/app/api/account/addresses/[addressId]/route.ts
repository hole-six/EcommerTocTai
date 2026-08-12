import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { accountAddressUpdateSchema } from "@/lib/server/validators";
import { User } from "@/models/User";

export async function PATCH(request: Request, context: RouteContext<"/api/account/addresses/[addressId]">) {
  try {
    const session = await requireUser();
    const { addressId } = await context.params;
    const data = accountAddressUpdateSchema.parse(await request.json());
    await connectDb();
    if (data.isDefault) await User.findByIdAndUpdate(session.id, { $set: { "addresses.$[].isDefault": false } });
    const set = Object.fromEntries(Object.entries(data).map(([key, value]) => [`addresses.$.${key}`, value]));
    const user = await User.findOneAndUpdate({ _id: session.id, "addresses._id": addressId }, { $set: set }, { new: true }).select("-passwordHash");
    return user ? NextResponse.json({ data: user }) : NextResponse.json({ error: "Không tìm thấy địa chỉ" }, { status: 404 });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_request: Request, context: RouteContext<"/api/account/addresses/[addressId]">) {
  try {
    const session = await requireUser();
    const { addressId } = await context.params;
    await connectDb();
    const user = await User.findByIdAndUpdate(session.id, { $pull: { addresses: { _id: addressId } } }, { new: true }).select("-passwordHash");
    return NextResponse.json({ data: user });
  } catch (error) { return apiError(error); }
}
