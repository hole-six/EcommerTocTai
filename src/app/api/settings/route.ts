import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { Settings } from "@/models/Settings";

const settingsSchema = z.object({
  shippingFee: z.number().int().min(0).max(1000000),
});

export async function GET() {
  try {
    await connectDb();
    const settings = await Settings.findOneAndUpdate(
      { key: "store" },
      { $setOnInsert: { key: "store" } },
      { new: true, upsert: true },
    ).lean();
    return NextResponse.json({
      data: {
        shippingFee: settings.shippingFee,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const data = settingsSchema.partial().parse(await request.json());
    await connectDb();
    const settings = await Settings.findOneAndUpdate(
      { key: "store" },
      { $set: data, $setOnInsert: { key: "store" } },
      { new: true, upsert: true },
    );
    return NextResponse.json({
      data: {
        shippingFee: settings.shippingFee,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
