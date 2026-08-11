import { NextResponse } from "next/server";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import { requireUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { reviewSchema } from "@/lib/server/validators";

export async function GET(request: Request) { try { const productId = new URL(request.url).searchParams.get("productId"); if (!productId) return NextResponse.json({ error: "Thiếu productId" }, { status: 400 }); await connectDb(); return NextResponse.json({ data: await Review.find({ product: productId, isPublished: true }).populate("user", "fullName").sort({ createdAt: -1 }).lean() }); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { const user = await requireUser(); const data = reviewSchema.parse(await request.json()); await connectDb(); const order = await Order.findOne({ _id: data.orderId, user: user.id, status: "completed", "items.product": data.productId }).lean(); if (!order) return NextResponse.json({ error: "Bạn chỉ có thể đánh giá sản phẩm trong đơn đã hoàn tất" }, { status: 403 }); const review = await Review.create({ product: data.productId, user: user.id, order: data.orderId, rating: data.rating, title: data.title, body: data.body }); return NextResponse.json({ data: review }, { status: 201 }); } catch (error) { return apiError(error); } }
