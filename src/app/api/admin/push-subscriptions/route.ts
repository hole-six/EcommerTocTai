import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { PushSubscription } from "@/models/PushSubscription";

const subscriptionSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const data = subscriptionSchema.parse(await request.json());
    await connectDb();
    await PushSubscription.findOneAndUpdate(
      { endpoint: data.endpoint },
      {
        $set: {
          user: session.id,
          role: "admin",
          keys: data.keys,
          userAgent: request.headers.get("user-agent") ?? "",
        },
      },
      { upsert: true },
    );
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const data = z.object({ endpoint: z.string().min(1) }).parse(await request.json());
    await connectDb();
    await PushSubscription.deleteOne({ endpoint: data.endpoint });
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return apiError(error);
  }
}
