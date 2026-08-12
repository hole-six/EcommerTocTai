import { NextResponse } from "next/server";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import { currentUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { reviewSchema } from "@/lib/server/validators";

export async function GET(request: Request) { try { const productId = new URL(request.url).searchParams.get("productId"); if (!productId) return NextResponse.json({ error: "Thiếu productId" }, { status: 400 }); await connectDb(); return NextResponse.json({ data: await Review.find({ product: productId, isPublished: true }).populate("user", "fullName").sort({ createdAt: -1 }).lean() }); } catch (error) { return apiError(error); } }
export async function POST(request: Request) {
  try {
    const data = reviewSchema.parse(await request.json());
    const session = await currentUser();
    await connectDb();
    let order;
    let reviewer: Record<string, unknown>;
    if (session) {
      order = await Order.findOne({ user: session.id, status: "completed", "items.product": data.productId }).sort({ createdAt: -1 }).lean();
      reviewer = { user: session.id };
    } else {
      if (!data.guestName || !data.guestPhone) return NextResponse.json({ error: "Vui lòng nhập họ tên và số điện thoại" }, { status: 400 });
      order = await Order.findOne({ "customer.phone": data.guestPhone, status: "completed", "items.product": data.productId }).sort({ createdAt: -1 }).lean();
      reviewer = { guestName: data.guestName, guestPhone: data.guestPhone };
    }
    if (!order) return NextResponse.json({ error: session ? "Bạn chỉ có thể đánh giá sản phẩm trong đơn đã hoàn tất" : "Số điện thoại này chưa có đơn hàng thành công cho sản phẩm này" }, { status: 403 });
    const review = await Review.create({ product: data.productId, order: order._id, rating: data.rating, title: data.title, body: data.body, ...reviewer });
    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) { return apiError(error); }
}
