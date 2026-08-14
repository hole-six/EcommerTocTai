import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { resetPasswordSchema } from "@/lib/server/validators";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const { token, password } = resetPasswordSchema.parse(await request.json());
    await connectDb();
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });
    if (!user)
      return NextResponse.json(
        { error: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." },
        { status: 400 },
      );
    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetToken = "";
    user.resetTokenExpiry = null;
    await user.save();
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return apiError(error);
  }
}
