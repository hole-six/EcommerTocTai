import { NextResponse } from "next/server";
import { Product } from "@/models/Product";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { productSchema } from "@/lib/server/validators";

export async function GET(_request: Request, context: RouteContext<"/api/commerce/products/[id]">) { try { const { id } = await context.params; await connectDb(); const product = await Product.findOne({ $or: [{ _id: id }, { slug: id }], status: "active" }).populate("category", "name slug detailFields").lean(); return product ? NextResponse.json({ data: product }) : NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 }); } catch (error) { return apiError(error); } }
export async function PATCH(request: Request, context: RouteContext<"/api/commerce/products/[id]">) { try { await requireAdmin(); const { id } = await context.params; const data = productSchema.partial().parse(await request.json()); await connectDb(); const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true }); return product ? NextResponse.json({ data: product }) : NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 }); } catch (error) { return apiError(error); } }
export async function DELETE(_request: Request, context: RouteContext<"/api/commerce/products/[id]">) { try { await requireAdmin(); const { id } = await context.params; await connectDb(); const product = await Product.findByIdAndUpdate(id, { status: "archived" }, { new: true }); return product ? NextResponse.json({ data: { success: true } }) : NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 }); } catch (error) { return apiError(error); } }
