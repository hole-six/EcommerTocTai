import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { Order } from "@/models/Order";
import { apiError } from "@/lib/server/http";
export async function GET(_request: Request, context: { params: Promise<{ orderNumber: string }> }) { try { const { orderNumber } = await context.params; await connectDb(); const order = await Order.findOne({ orderNumber }).select("orderNumber total paymentMethod paymentCode paymentStatus status").lean(); if (!order) return NextResponse.json({ error: "Khong tim thay don hang" }, { status: 404 }); return NextResponse.json({ data: order }); } catch (error) { return apiError(error); } }