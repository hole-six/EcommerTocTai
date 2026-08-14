import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { createSession, sessionCookie } from "@/lib/server/auth";
import { loginSchema } from "@/lib/server/validators";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const data = loginSchema.parse(await request.json());
    await connectDb();
    const user = await User.findOne(
      data.phone
        ? { phone: data.phone.trim() }
        : { email: data.email?.trim().toLowerCase() },
    ).lean();
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) return NextResponse.json({ error: "Thông tin đăng nhập không đúng" }, { status: 401 });
    if (user.isActive === false) return NextResponse.json({ error: "Tài khoản này đang tạm ngưng. Vui lòng liên hệ cửa hàng." }, { status: 403 });
    const token = await createSession({ id: user._id.toString(), role: user.role, phone: user.phone });
    const response = NextResponse.json({ data: { id: user._id.toString(), fullName: user.fullName, role: user.role } });
    response.cookies.set(sessionCookie(token));
    return response;
  } catch (error) { return apiError(error); }
}
