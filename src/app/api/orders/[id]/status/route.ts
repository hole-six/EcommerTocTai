import { z } from "zod";
import { NextResponse } from "next/server";
import { Order } from "@/models/Order";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

const statusSchema = z.object({ status: z.enum(["pending", "confirmed", "processing", "shipping", "completed", "cancelled"]), paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional() });
export async function PATCH(request: Request, context: RouteContext<"/api/orders/[id]/status">) { try { await requireAdmin(); const { id } = await context.params; const data = statusSchema.parse(await request.json()); await connectDb(); const order = await Order.findByIdAndUpdate(id, data, { new: true }); return order ? NextResponse.json({ data: order }) : NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 }); } catch (error) { return apiError(error); } }
