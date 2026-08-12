import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { notifyAdmins } from "@/lib/server/notifications";
import { SupportThread } from "@/models/SupportThread";
import { User } from "@/models/User";

const messageSchema = z.object({
  threadId: z.string().optional(),
  visitorId: z.string().trim().min(8).max(80).optional(),
  customerName: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  body: z.string().trim().min(1).max(1000),
});

async function customerMeta(userId?: string | null) {
  if (!userId) return null;
  return User.findById(userId).select("fullName phone email").lean();
}

export async function GET(request: Request) {
  try {
    const session = await currentUser();
    const visitorId = new URL(request.url).searchParams.get("visitorId") ?? "";
    await connectDb();
    const filter = session
      ? { user: session.id }
      : visitorId
        ? { visitorId }
        : null;
    if (!filter) return NextResponse.json({ data: null });
    const thread = await SupportThread.findOne(filter).sort({ updatedAt: -1 }).lean();
    if (thread) await SupportThread.updateOne({ _id: thread._id }, { $set: { unreadForCustomer: 0 } });
    return NextResponse.json({ data: thread });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await currentUser();
    const data = messageSchema.parse(await request.json());
    await connectDb();
    const user = await customerMeta(session?.id);
    let thread = data.threadId
      ? await SupportThread.findById(data.threadId)
      : null;
    if (!thread && session)
      thread = await SupportThread.findOne({ user: session.id }).sort({ updatedAt: -1 });
    if (!thread && data.visitorId)
      thread = await SupportThread.findOne({ visitorId: data.visitorId }).sort({ updatedAt: -1 });
    if (!thread) {
      thread = await SupportThread.create({
        user: session?.id ?? null,
        visitorId: session ? "" : data.visitorId,
        customerName: user?.fullName ?? data.customerName ?? "Khách hàng",
        phone: user?.phone ?? data.phone ?? "",
        email: user?.email ?? data.email ?? "",
      });
    }
    thread.customerName = user?.fullName ?? data.customerName ?? thread.customerName;
    thread.phone = user?.phone ?? data.phone ?? thread.phone;
    thread.email = user?.email ?? data.email ?? thread.email;
    thread.status = thread.status === "closed" ? "open" : thread.status;
    thread.lastMessage = data.body;
    thread.lastMessageAt = new Date();
    thread.unreadForAdmin += 1;
    thread.messages.push({
      senderRole: "customer",
      senderName: thread.customerName,
      body: data.body,
      createdAt: new Date(),
    });
    await thread.save();
    await notifyAdmins({
      type: "chat",
      title: "Tin nhắn hỗ trợ mới",
      body: `${thread.customerName}: ${data.body}`,
      href: "/admin/support",
    });
    return NextResponse.json({ data: thread.toObject() }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
