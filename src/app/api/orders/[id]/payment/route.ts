import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { createSePayPayment } from "@/lib/server/sepay";
import { Order } from "@/models/Order";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: orderNumber } = await context.params;
  await connectDb();
  const order = await Order.findOne({ orderNumber })
    .select("orderNumber total paymentMethod paymentCode paymentStatus status")
    .lean();
  if (!order)
    return NextResponse.json(
      { error: "Không tìm thấy đơn hàng" },
      { status: 404 },
    );
  return NextResponse.json({
    data: {
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      status: order.status,
      payment:
        order.paymentMethod === "bank_transfer" && order.paymentCode
          ? createSePayPayment(order.paymentCode, order.total)
          : null,
    },
  });
}
