import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession, requireUser, sessionCookie } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { profileSchema, updatePhoneSchema } from "@/lib/server/validators";
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
    const raw = await request.json();
    await connectDb();

    if (typeof raw?.phone === "string") {
      const data = updatePhoneSchema.parse(raw);
      const current = await User.findById(session.id).select("passwordHash phone");
      if (!current || !(await bcrypt.compare(data.currentPassword, current.passwordHash)))
        return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 401 });
      if (data.phone !== current.phone) {
        const taken = await User.exists({ phone: data.phone, _id: { $ne: session.id } });
        if (taken)
          return NextResponse.json({ error: "Số điện thoại này đã được dùng cho tài khoản khác" }, { status: 409 });
        current.phone = data.phone;
        await current.save();
      }
      const user = await User.findById(session.id).select("-passwordHash");
      const token = await createSession({ id: session.id, role: session.role, phone: data.phone });
      const response = NextResponse.json({ data: user });
      response.cookies.set(sessionCookie(token));
      return response;
    }

    const data = profileSchema.parse(raw);
    const user = await User.findByIdAndUpdate(session.id, data, { new: true }).select("-passwordHash");
    return NextResponse.json({ data: user });
  } catch (error) { return apiError(error); }
}
