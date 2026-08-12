import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { notify } from "@/lib/server/notifications";
import { SupportThread } from "@/models/SupportThread";

const patchSchema = z.object({
  body: z.string().trim().min(1).max(1000).optional(),
  status: z.enum(["open", "pending", "closed"]).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const data = patchSchema.parse(await request.json());
    await connectDb();
    const thread = await SupportThread.findById(id);
    if (!thread)
      return NextResponse.json({ error: "Không tìm thấy hội thoại" }, { status: 404 });
    if (data.status) thread.status = data.status;
    thread.unreadForAdmin = 0;
    if (data.body) {
      thread.messages.push({
        senderRole: "admin",
        senderName: "CareWise Support",
        body: data.body,
        createdAt: new Date(),
      });
      thread.lastMessage = data.body;
      thread.lastMessageAt = new Date();
      thread.unreadForCustomer += 1;
      if (thread.user) {
        await notify(
          { recipientRole: "customer", user: thread.user },
          {
            type: "chat",
            title: "CareWise đã phản hồi bạn",
            body: data.body,
            href: "/",
          },
        );
      }
    }
    await thread.save();
    return NextResponse.json({ data: thread.toObject() });
  } catch (error) {
    return apiError(error);
  }
}
