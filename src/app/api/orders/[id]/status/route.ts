import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { InventoryError, settleOrderInventory } from "@/lib/server/inventory";
import { notify } from "@/lib/server/notifications";
import { Order } from "@/models/Order";

const statusSchema = z.object({
  status: z
    .enum(["pending", "confirmed", "processing", "shipping", "completed", "cancelled", "returned"])
    .optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
  trackingNumber: z.string().trim().max(60).optional(),
  shippingProvider: z.enum(["ghn", "ghtk", "viettelpost", "jt", "manual"]).optional(),
});

const statusText = {
  pending: "chờ xác nhận",
  confirmed: "đã xác nhận",
  processing: "đang xử lý",
  shipping: "đang giao",
  completed: "đã hoàn tất",
  cancelled: "đã hủy",
  returned: "đã hoàn hàng",
} as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const data = statusSchema.parse(await request.json());
    await connectDb();

    const current = await Order.findById(id).lean();
    if (!current)
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 },
      );

    if (data.status === "completed" && current.inventoryState !== "committed") {
      if (current.inventoryState !== "reserved")
        throw new InventoryError(
          "Đơn chưa có tồn kho giữ chỗ hợp lệ để hoàn tất.",
          "BUSY",
        );
      await settleOrderInventory(id, "committed");
    }
    if (
      (data.status === "cancelled" || data.status === "returned") &&
      current.inventoryState === "reserved"
    ) {
      await settleOrderInventory(id, "released");
    }
    if (data.status === "returned" && current.inventoryState !== "returned") {
      if (current.inventoryState !== "committed")
        throw new InventoryError(
          "Chỉ hoàn hàng được sau khi đơn đã hoàn tất.",
          "BUSY",
        );
      await settleOrderInventory(id, "returned");
    }

    const update: Record<string, unknown> = { ...data };
    if (data.trackingNumber) {
      update.shippedAt = new Date();
      if (!data.status) update.status = "shipping";
    }

    const order = await Order.findByIdAndUpdate(id, update, { new: true });
    if (order?.user && (data.status || update.status)) {
      const finalStatus = (data.status ?? update.status) as keyof typeof statusText;
      await notify(
        { recipientRole: "customer", user: order.user },
        {
          type: "order",
          title: `Đơn ${order.orderNumber} ${statusText[finalStatus]}`,
          body: order.trackingNumber
            ? `Mã vận đơn: ${order.trackingNumber}`
            : "Bạn có thể theo dõi đơn trong tài khoản.",
          href: "/account",
        },
      );
    }
    if (order?.user && data.paymentStatus) {
      await notify(
        { recipientRole: "customer", user: order.user },
        {
          type: "payment",
          title:
            data.paymentStatus === "paid"
              ? "Thanh toán đã được xác nhận"
              : "Trạng thái thanh toán đã cập nhật",
          body: `Đơn ${order.orderNumber}`,
          href: "/account",
        },
      );
    }

    return NextResponse.json({ data: order });
  } catch (error) {
    if (error instanceof InventoryError)
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "OUT_OF_STOCK" ? 409 : 423 },
      );
    return apiError(error);
  }
}
