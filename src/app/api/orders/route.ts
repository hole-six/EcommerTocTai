import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { Coupon } from "@/models/Coupon";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { CatalogProduct } from "@/models/CatalogProduct";
import { User } from "@/models/User";
import { currentUser, requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { resolveCoupon } from "@/lib/server/coupons";
import { apiError } from "@/lib/server/http";
import { InventoryError, reserveOrder } from "@/lib/server/inventory";
import { notify, notifyAdmins } from "@/lib/server/notifications";
import { createPaymentCode, createSePayPayment } from "@/lib/server/sepay";
import { orderSchema } from "@/lib/server/validators";

const orderNumber = () =>
  `TT-${Date.now().toString().slice(-8)}-${randomUUID().slice(0, 5).toUpperCase()}`;
type OrderLineInput = {
  productId: string;
  quantity: number;
  variantId?: string;
  options: { groupCode: string; optionValue: string }[];
};
type ProductLike = {
  _id?: unknown;
  id?: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  images?: string[];
  optionGroups?: Array<{
    code: string;
    title: string;
    options?: Array<{
      value: string;
      label: string;
      priceAdjustment?: number;
    }>;
  }>;
  variants?: Array<{
    id: string;
    title: string;
    sku?: string;
    price?: number;
    optionValues?: Record<string, string>;
  }>;
};

function resolveLine(product: ProductLike, line: OrderLineInput) {
  const selections = line.options ?? [];
  const options = selections.map((selection) => {
    const group = product.optionGroups?.find(
      (entry) => entry.code === selection.groupCode,
    );
    const option = group?.options?.find(
      (entry) => entry.value === selection.optionValue,
    );
    if (!group || !option) throw new Error("INVALID_VARIANT");
    return {
      groupCode: group.code,
      groupTitle: group.title,
      optionValue: option.value,
      optionLabel: option.label,
      priceAdjustment: Number(option.priceAdjustment ?? 0),
    };
  });
  const variant =
    product.variants?.find((entry) => entry.id === line.variantId) ??
    product.variants?.find((entry) =>
      Object.entries(entry.optionValues ?? {}).every(([code, value]) =>
        selections.some(
          (selection) =>
            selection.groupCode === code && selection.optionValue === value,
        ),
      ),
    );
  const basePrice = product.salePrice ?? product.price;
  const unitPrice =
    typeof variant?.price === "number"
      ? variant.price
      : basePrice + options.reduce((sum, option) => sum + option.priceAdjustment, 0);
  return {
    sku: variant?.sku || product.sku,
    unitPrice,
    variantId: variant?.id ?? line.variantId ?? "",
    variantTitle:
      variant?.title || options.map((option) => option.optionLabel).join(" / "),
    options,
  };
}

export async function GET() {
  try {
    await requireAdmin();
    await connectDb();
    return NextResponse.json({
      data: await Order.find().sort({ createdAt: -1 }).limit(100).lean(),
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    const data = orderSchema.parse(await request.json());
    const session = await currentUser();
    await connectDb();
    const ids = [...new Set(data.items.map((item) => item.productId))];
    const products = await Product.find({
      _id: { $in: ids },
      status: "active",
    }).lean();
    const catalogProducts = await CatalogProduct.find({
      id: { $in: ids },
      status: "active",
    }).lean();
    if (
      data.items.some(
        (line) =>
          !products.some((item) => item._id.toString() === line.productId) &&
          !catalogProducts.some((item) => item.id === line.productId),
      )
    )
      return NextResponse.json(
        { error: "Một hoặc nhiều sản phẩm không còn bán" },
        { status: 409 },
      );
    const items = data.items.map((line) => {
      const product = products.find(
        (item) => item._id.toString() === line.productId,
      );
      if (product) {
        const resolved = resolveLine(product as ProductLike, line);
        return {
          product: product._id,
          catalogProductId: "",
          name: product.name,
          sku: resolved.sku,
          quantity: line.quantity,
          unitPrice: resolved.unitPrice,
          image: product.images[0] ?? "",
          variantId: resolved.variantId,
          variantTitle: resolved.variantTitle,
          options: resolved.options,
        };
      }
      const catalogProduct = catalogProducts.find(
        (item) => item.id === line.productId,
      );
      if (!catalogProduct) throw new Error("OUT_OF_STOCK");
      const resolved = resolveLine(catalogProduct as ProductLike, line);
      return {
        product: null,
        catalogProductId: catalogProduct.id,
        name: catalogProduct.name,
        sku: resolved.sku,
        quantity: line.quantity,
        unitPrice: resolved.unitPrice,
        image: catalogProduct.images[0] ?? "",
        variantId: resolved.variantId,
        variantTitle: resolved.variantTitle,
        options: resolved.options,
      };
    });
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const shippingFee = subtotal >= 499000 ? 0 : 30000;
    let discount = 0;
    if (data.couponCode) {
      const result = await resolveCoupon(data.couponCode, subtotal);
      if ("error" in result)
        return NextResponse.json({ error: result.error }, { status: 400 });
      discount = result.discount;
    }
    const total = subtotal + shippingFee - discount;
    if (
      data.paymentMethod === "bank_transfer" &&
      !createSePayPayment("CHECK", total)
    )
      return NextResponse.json(
        {
          error:
            "Thanh toán chuyển khoản chưa được cấu hình. Vui lòng liên hệ cửa hàng hoặc chọn COD.",
        },
        { status: 503 },
      );
    const paymentCode =
      data.paymentMethod === "bank_transfer" ? createPaymentCode() : "";
    const order = await Order.create({
      orderNumber: orderNumber(),
      user: session?.id ?? null,
      customer: data.customer,
      shippingAddress: data.shippingAddress,
      items,
      subtotal,
      shippingFee,
      couponCode: data.couponCode ? data.couponCode.trim().toUpperCase() : "",
      discount,
      total,
      note: data.note,
      paymentMethod: data.paymentMethod,
      paymentCode,
      inventoryState: "none",
    });
    try {
      await reserveOrder(order._id.toString());
    } catch (error) {
      await Order.findByIdAndDelete(order._id);
      if (error instanceof InventoryError)
        return NextResponse.json(
          { error: error.message },
          { status: error.code === "OUT_OF_STOCK" ? 409 : 423 },
        );
      throw error;
    }
    if (data.couponCode && discount > 0)
      await Coupon.updateOne(
        { code: data.couponCode.trim().toUpperCase() },
        { $inc: { usedCount: 1 } },
      );
    if (session && data.saveAddress) {
      const existing = await User.findById(session.id)
        .select("addresses")
        .lean();
      const isDefault = !existing?.addresses?.length;
      if (isDefault)
        await User.findByIdAndUpdate(session.id, {
          $set: { "addresses.$[].isDefault": false },
        });
      await User.findByIdAndUpdate(session.id, {
        $push: { addresses: { ...data.shippingAddress, isDefault } },
      });
    }
    await notifyAdmins({
      type: "order",
      title: "Có đơn hàng mới",
      body: `${order.orderNumber} · ${data.customer.fullName} · ${total.toLocaleString("vi-VN")}đ`,
      href: "/admin/orders",
    });
    if (session) {
      await notify(
        { recipientRole: "customer", user: session.id },
        {
          type: "order",
          title: "Đơn hàng đã được tạo",
          body: `${order.orderNumber} đang chờ xác nhận.`,
          href: "/account",
        },
      );
    }
    return NextResponse.json(
      {
        data: await Order.findById(order._id).lean(),
        payment: paymentCode ? createSePayPayment(paymentCode, total) : null,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "OUT_OF_STOCK")
      return NextResponse.json(
        { error: "Sản phẩm không đủ tồn kho" },
        { status: 409 },
      );
    if (error instanceof Error && error.message === "INVALID_VARIANT")
      return NextResponse.json(
        { error: "Biến thể sản phẩm không hợp lệ hoặc đã thay đổi." },
        { status: 409 },
      );
    return apiError(error);
  }
}
