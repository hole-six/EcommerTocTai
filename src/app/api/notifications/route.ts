import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, requireUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { Notification } from "@/models/Notification";

const patchSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional(),
});

function filterFor(user: { id: string; role: "customer" | "admin" }) {
  if (user.role === "admin") return { recipientRole: "admin" };
  return { recipientRole: "customer", user: user.id };
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ data: [], unread: 0 });
    await connectDb();
    const filter = filterFor(user);
    const [items, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(30).lean(),
      Notification.countDocuments({ ...filter, readAt: null }),
    ]);
    return NextResponse.json({ data: items, unread });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const data = patchSchema.parse(await request.json());
    await connectDb();
    const filter = filterFor(user);
    if (data.all) {
      await Notification.updateMany(
        { ...filter, readAt: null },
        { $set: { readAt: new Date() } },
      );
    } else if (data.id) {
      await Notification.updateOne(
        { ...filter, _id: data.id },
        { $set: { readAt: new Date() } },
      );
    }
    const unread = await Notification.countDocuments({ ...filter, readAt: null });
    return NextResponse.json({ ok: true, unread });
  } catch (error) {
    return apiError(error);
  }
}
