import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

const customerPatchSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().regex(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, "Số điện thoại Việt Nam không hợp lệ").optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(100).optional(),
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
    const { password, ...rest } = data;
    const update: Record<string, unknown> = { ...rest, email: data.email || undefined };
    if (password) update.passwordHash = await bcrypt.hash(password, 12);
    const user = await User.findOneAndUpdate(
      { _id: id, role: "customer" },
      { $set: update },
      { new: true, runValidators: true },
    ).select("-passwordHash");
    return user
      ? NextResponse.json({ data: user })
      : NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    if (id === admin.id) {
      return NextResponse.json({ error: "Không thể tự xóa tài khoản admin đang đăng nhập." }, { status: 422 });
    }
    await connectDb();
    const hasOrders = await Order.exists({ user: id });
    if (hasOrders) {
      return NextResponse.json(
        { error: "Khách hàng đã có đơn hàng, không thể xóa — hãy tạm ngưng tài khoản thay vì xóa." },
        { status: 422 },
      );
    }
    const deleted = await User.findOneAndDelete({ _id: id, role: "customer" });
    return deleted
      ? NextResponse.json({ data: { id } })
      : NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}
