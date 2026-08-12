import { NextResponse } from "next/server";
import { z } from "zod";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

const customerPatchSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().regex(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, "Số điện thoại Việt Nam không hợp lệ").optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const data = customerPatchSchema.parse(await request.json());
    if (id === admin.id && data.isActive === false) {
      return NextResponse.json({ error: "Không thể tự tạm ngưng tài khoản admin đang đăng nhập." }, { status: 422 });
    }
    await connectDb();
    const user = await User.findOneAndUpdate(
      { _id: id, role: "customer" },
      { $set: { ...data, email: data.email || undefined } },
      { new: true, runValidators: true },
    ).select("-passwordHash");
    return user
      ? NextResponse.json({ data: user })
      : NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}
