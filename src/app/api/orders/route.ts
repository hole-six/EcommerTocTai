import { NextResponse } from "next/server";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { currentUser, requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { orderSchema } from "@/lib/server/validators";

const orderNumber = () => `TT-${Date.now().toString().slice(-8)}`;

export async function GET() { try { await requireAdmin(); await connectDb(); return NextResponse.json({ data: await Order.find().sort({ createdAt: -1 }).limit(100).lean() }); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { const data = orderSchema.parse(await request.json()); const session = await currentUser(); await connectDb(); const products = await Product.find({ _id: { $in: data.items.map((item) => item.productId) }, status: "active" }).lean(); if (products.length !== data.items.length) return NextResponse.json({ error: "Một hoặc nhiều sản phẩm không còn bán" }, { status: 409 }); const items = data.items.map((line) => { const product = products.find((item) => item._id.toString() === line.productId); if (!product || product.inventory < line.quantity) throw new Error("OUT_OF_STOCK"); return { product: product._id, name: product.name, sku: product.sku, quantity: line.quantity, unitPrice: product.salePrice ?? product.price, image: product.images[0] ?? "" }; }); const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0); const shippingFee = subtotal >= 499000 ? 0 : 30000; const order = await Order.create({ orderNumber: orderNumber(), user: session?.id ?? null, customer: data.customer, shippingAddress: data.shippingAddress, items, subtotal, shippingFee, total: subtotal + shippingFee, note: data.note, paymentMethod: data.paymentMethod }); await Promise.all(items.map((item) => Product.findByIdAndUpdate(item.product, { $inc: { inventory: -item.quantity } }))); if (session && data.saveAddress) await User.findByIdAndUpdate(session.id, { $push: { addresses: { ...data.shippingAddress, isDefault: false } } }); return NextResponse.json({ data: order }, { status: 201 }); } catch (error) { if (error instanceof Error && error.message === "OUT_OF_STOCK") return NextResponse.json({ error: "Sản phẩm không đủ tồn kho" }, { status: 409 }); return apiError(error); } }
