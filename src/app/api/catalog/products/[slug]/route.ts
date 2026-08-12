import { NextResponse } from "next/server";
import { catalogRepository } from "@/lib/catalog/repository";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
export async function GET(_request: Request, context: RouteContext<"/api/catalog/products/[slug]">) { try { const { slug } = await context.params; const product = await catalogRepository.find(slug); return product ? NextResponse.json({ data: product }) : NextResponse.json({ error: "Product not found" }, { status: 404 }); } catch (error) { return apiError(error); } }
export async function PATCH(request: Request, context: RouteContext<"/api/catalog/products/[slug]">) { try { await requireAdmin(); const { slug } = await context.params; const product = await catalogRepository.update(slug, await request.json()); return product ? NextResponse.json({ data: product }) : NextResponse.json({ error: "Product not found" }, { status: 404 }); } catch (error) { return apiError(error); } }