import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { createSession, sessionCookie } from "@/lib/server/auth";
import { registerSchema } from "@/lib/server/validators";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const data = registerSchema.parse(await request.json());
    const email = data.email?.trim().toLowerCase();
    await connectDb();
    if (await User.exists({ $or: [{ phone: data.phone }, ...(email ? [{ email }] : [])] })) return NextResponse.json({ error: "Số điện thoại hoặc email đã được dùng" }, { status: 409 });
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((entry) => entry.trim().toLowerCase());
    const role = email && adminEmails.includes(email) ? "admin" : "customer";
    const user = await User.create({ fullName: data.fullName, email, phone: data.phone, passwordHash: await bcrypt.hash(data.password, 12), role });
    const token = await createSession({ id: user.id, role, phone: user.phone });
    const response = NextResponse.json({ data: { id: user.id, fullName: user.fullName, role } }, { status: 201 });
    response.cookies.set(sessionCookie(token));
    return response;
  } catch (error) { return apiError(error); }
}
