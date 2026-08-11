import { NextResponse } from "next/server";
import { Category } from "@/models/Category";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { categorySchema } from "@/lib/server/validators";

export async function PATCH(request: Request, context: RouteContext<"/api/categories/[id]">) { try { await requireAdmin(); const { id } = await context.params; const data = categorySchema.partial().parse(await request.json()); await connectDb(); const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true }); return category ? NextResponse.json({ data: category }) : NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 }); } catch (error) { return apiError(error); } }
export async function DELETE(_request: Request, context: RouteContext<"/api/categories/[id]">) { try { await requireAdmin(); const { id } = await context.params; await connectDb(); const category = await Category.findByIdAndDelete(id); return category ? NextResponse.json({ data: { success: true } }) : NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 }); } catch (error) { return apiError(error); } }
