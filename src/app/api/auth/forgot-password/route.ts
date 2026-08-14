import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { isMailConfigured, sendMail } from "@/lib/server/mail";
import { SITE_URL } from "@/lib/server/site";
import { forgotPasswordSchema } from "@/lib/server/validators";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const { email } = forgotPasswordSchema.parse(await request.json());
    const normalizedEmail = email.trim().toLowerCase();
    await connectDb();
    // Always report success even if the email isn't registered, so this
    // endpoint can't be used to enumerate which emails have accounts.
    const genericResponse = NextResponse.json({
      data: {
        message: "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
      },
    });
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return genericResponse;
    if (!isMailConfigured()) {
      return NextResponse.json(
        { error: "Chức năng gửi email chưa được cấu hình trên server." },
        { status: 503 },
      );
    }
    const token = randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    const resetUrl = `${SITE_URL}/reset-password?token=${token}`;
    await sendMail(
      normalizedEmail,
      "Đặt lại mật khẩu Tóc Tai",
      `<p>Xin chào ${user.fullName},</p>
       <p>Bạn vừa yêu cầu đặt lại mật khẩu. Bấm vào liên kết bên dưới để đặt mật khẩu mới (liên kết có hiệu lực trong 30 phút):</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>`,
    );
    return genericResponse;
  } catch (error) {
    return apiError(error);
  }
}
